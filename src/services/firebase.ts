import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Slide } from '../types/presentation';

// 1. Initialize Firebase App and Services
export const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
];

export const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request Google Slides (Presentazioni) scopes
SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// In-memory cache for OAuth access token (per workspace skill rules)
let cachedAccessToken: string | null = null;

export const getCachedAccessToken = (): string | null => cachedAccessToken;
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// 2. Validate Connection to Firestore on startup
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Please check network/config.');
    }
    return false;
  }
}
testConnection();

// 3. Error Handling conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Data Types for Saved Projects
export interface SavedProject {
  id: string;
  ownerId: string;
  title: string;
  themeId: string;
  slides: Slide[];
  slideCount: number;
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | any;
  updatedAt?: Timestamp | { seconds: number; nanoseconds: number } | any;
}

// 5. Auth Helper Functions
export async function signInWithGoogle(): Promise<{ user: User; accessToken?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

    // Sync or initialize user profile document
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef).catch(() => null);
      if (!userDoc || !userDoc.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Utente SlideZen',
          photoURL: result.user.photoURL || '',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        }).catch((err) => {
          console.warn('Could not save user profile document:', err);
        });
      } else {
        await updateDoc(userRef, {
          lastLoginAt: new Date().toISOString(),
        }).catch((err) => {
          console.warn('Could not update user lastLoginAt:', err);
        });
      }
    }
    return { user: result.user, accessToken: credential?.accessToken || undefined };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function getGoogleSlidesAccessToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  // If no cached token in memory, prompt popup to authenticate and obtain token with requested scopes
  const { accessToken } = await signInWithGoogle();
  if (!accessToken) {
    throw new Error('Impossibile ottenere il token di accesso con permessi Google Presentazioni');
  }
  return accessToken;
}

export async function signOutUser(): Promise<void> {
  cachedAccessToken = null;
  return firebaseSignOut(auth);
}

function removeUndefinedDeep(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(removeUndefinedDeep);
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        res[k] = removeUndefinedDeep(v);
      }
    }
    return res;
  }
  return obj;
}

function sanitizeSlideForFirestore(slide: Slide): Record<string, any> {
  const deepCleaned = removeUndefinedDeep(slide);
  return JSON.parse(JSON.stringify(deepCleaned));
}

// 6. Firestore Project Management Operations
export async function saveProjectToFirestore(
  project: {
    id?: string;
    title: string;
    slides: Slide[];
    themeId: string;
  }
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Devi aver effettuato l\'accesso con Google per salvare il progetto.');
  }

  const cleanTitle = (project.title || 'Presentazione senza titolo').trim().slice(0, 200) || 'Presentazione senza titolo';
  const rawSlides = project.slides && project.slides.length > 0 ? project.slides.slice(0, 100) : [];
  const cleanSlides = rawSlides.map(sanitizeSlideForFirestore);
  const slideCount = cleanSlides.length;

  if (project.id) {
    // Update existing project
    const path = `users/${user.uid}/projects/${project.id}`;
    const projectRef = doc(db, 'users', user.uid, 'projects', project.id);
    try {
      await updateDoc(projectRef, {
        title: cleanTitle,
        themeId: project.themeId,
        slides: cleanSlides,
        slideCount,
        updatedAt: serverTimestamp(),
      });
      return project.id;
    } catch (error: any) {
      // If document was not found (e.g. from local storage or previous session), create it cleanly
      if (error?.code === 'not-found' || error?.message?.includes('No document to update')) {
        try {
          await setDoc(projectRef, {
            ownerId: user.uid,
            title: cleanTitle,
            themeId: project.themeId,
            slides: cleanSlides,
            slideCount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return project.id;
        } catch (setErr) {
          handleFirestoreError(setErr, OperationType.CREATE, path);
        }
      }
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    // Create new project
    const projectsCol = collection(db, 'users', user.uid, 'projects');
    const newDocRef = doc(projectsCol);
    const path = `users/${user.uid}/projects/${newDocRef.id}`;
    try {
      await setDoc(newDocRef, {
        ownerId: user.uid,
        title: cleanTitle,
        themeId: project.themeId,
        slides: cleanSlides,
        slideCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newDocRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function getUserProjectsFromFirestore(): Promise<SavedProject[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const path = `users/${user.uid}/projects`;
  try {
    const projectsCol = collection(db, 'users', user.uid, 'projects');
    const snapshot = await getDocs(projectsCol);
    const projects: SavedProject[] = [];
    snapshot.forEach((docSnap) => {
      projects.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<SavedProject, 'id'>),
      });
    });
    // Sort client-side by updatedAt descending
    projects.sort((a, b) => {
      const timeA = a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || 0;
      return timeB - timeA;
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToUserProjects(
  onProjects: (projects: SavedProject[]) => void,
  onError?: (error: Error) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    onProjects([]);
    return () => {};
  }

  const path = `users/${user.uid}/projects`;
  const projectsCol = collection(db, 'users', user.uid, 'projects');
  
  return onSnapshot(
    projectsCol,
    (snapshot) => {
      const projects: SavedProject[] = [];
      snapshot.forEach((docSnap) => {
        projects.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SavedProject, 'id'>),
        });
      });
      projects.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });
      onProjects(projects);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Non autenticato');

  const path = `users/${user.uid}/projects/${projectId}`;
  try {
    const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
