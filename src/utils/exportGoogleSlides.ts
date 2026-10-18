import { Slide, PresentationTheme } from '../types/presentation';

// Convert hex color to Google Slides RGB (0.0 to 1.0)
function hexToRgb(hexColor: string): { red: number; green: number; blue: number } {
  if (!hexColor) return { red: 0.1, green: 0.1, blue: 0.1 };
  let clean = hexColor.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) {
    return { red: 0.1, green: 0.1, blue: 0.1 };
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { red: 0.1, green: 0.1, blue: 0.1 };
  return {
    red: Number((((num >> 16) & 255) / 255).toFixed(3)),
    green: Number((((num >> 8) & 255) / 255).toFixed(3)),
    blue: Number(((num & 255) / 255).toFixed(3)),
  };
}

// Generate random safe objectId (5 to 50 alphanumeric/underscore characters)
function genId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`.slice(0, 48);
}

export interface GoogleSlidesExportResult {
  presentationId: string;
  presentationUrl: string;
  title: string;
}

/**
 * Exports the given slides and theme to a real Google Slides presentation
 * in the authenticated user's Google Drive / Google Presentazioni account.
 */
export async function exportToGoogleSlides(
  slides: Slide[],
  theme: PresentationTheme,
  accessToken: string,
  customTitle?: string
): Promise<GoogleSlidesExportResult> {
  if (!slides || slides.length === 0) {
    throw new Error('Nessuna diapositiva da esportare.');
  }

  if (!accessToken) {
    throw new Error('Token di accesso Google mancante.');
  }

  const presentationTitle =
    customTitle ||
    slides[0]?.title?.trim() ||
    'Presentazione SlideZen';

  // 1. Create a new Google Slides presentation
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: presentationTitle,
    }),
  });

  if (!createRes.ok) {
    const errorJson = await createRes.json().catch(() => ({}));
    const message =
      errorJson.error?.message ||
      `Errore Google Slides (${createRes.status}): ${createRes.statusText}`;
    throw new Error(message);
  }

  const createdPresentation = await createRes.json();
  const presentationId = createdPresentation.presentationId;
  const initialSlideId = createdPresentation.slides?.[0]?.objectId;

  // 2. Build batchUpdate requests for all slides
  const requests: any[] = [];
  const slideBgRgb = hexToRgb(theme.slideBg);
  const textPrimaryRgb = hexToRgb(theme.textPrimary);
  const textSecondaryRgb = hexToRgb(theme.textSecondary);
  const accentRgb = hexToRgb(theme.accent);
  const cardBgRgb = hexToRgb(theme.cardBg);

  // Widescreen standard in PT: width 720, height 405
  slides.forEach((slide, idx) => {
    const slideObjectId = genId(`slide_${idx}`);

    // Create a new blank slide
    requests.push({
      createSlide: {
        objectId: slideObjectId,
        insertionIndex: idx,
        slideLayoutReference: {
          predefinedLayout: 'BLANK',
        },
      },
    });

    // Set slide background color
    requests.push({
      updatePageProperties: {
        objectId: slideObjectId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: {
              color: {
                rgbColor: slideBgRgb,
              },
            },
          },
        },
        fields: 'pageBackgroundFill.solidFill.color',
      },
    });

    // Populate elements based on layout
    if (slide.layout === 'hero') {
      // Big Title Box
      const titleBoxId = genId(`tb_title_${idx}`);
      requests.push({
        createShape: {
          objectId: titleBoxId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: {
              width: { magnitude: 600, unit: 'PT' },
              height: { magnitude: 110, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 60,
              translateY: 80,
              unit: 'PT',
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: titleBoxId,
          insertionIndex: 0,
          text: slide.title || 'Titolo',
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: titleBoxId,
          textRange: { type: 'ALL' },
          style: {
            bold: true,
            fontSize: { magnitude: 36, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: textPrimaryRgb } },
            fontFamily: 'Montserrat',
          },
          fields: 'bold,fontSize,foregroundColor,fontFamily',
        },
      });

      // Subtitle Box
      if (slide.subtitle) {
        const subBoxId = genId(`tb_sub_${idx}`);
        requests.push({
          createShape: {
            objectId: subBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 50, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 60,
                translateY: 200,
                unit: 'PT',
              },
            },
          },
        });
        requests.push({
          insertText: {
            objectId: subBoxId,
            insertionIndex: 0,
            text: slide.subtitle,
          },
        });
        requests.push({
          updateTextStyle: {
            objectId: subBoxId,
            textRange: { type: 'ALL' },
            style: {
              bold: false,
              fontSize: { magnitude: 20, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: accentRgb } },
              fontFamily: 'Montserrat',
            },
            fields: 'bold,fontSize,foregroundColor,fontFamily',
          },
        });
      }

      // Content Bullets Box
      if (slide.content && slide.content.length > 0) {
        const contentBoxId = genId(`tb_cnt_${idx}`);
        const formattedContent = slide.content.map((c) => `•  ${c}`).join('\n\n');
        requests.push({
          createShape: {
            objectId: contentBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 110, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 60,
                translateY: 260,
                unit: 'PT',
              },
            },
          },
        });
        requests.push({
          insertText: {
            objectId: contentBoxId,
            insertionIndex: 0,
            text: formattedContent,
          },
        });
        requests.push({
          updateTextStyle: {
            objectId: contentBoxId,
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 14, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: textSecondaryRgb } },
              fontFamily: 'Roboto',
            },
            fields: 'fontSize,foregroundColor,fontFamily',
          },
        });
      }
    } else if (slide.layout === 'stat') {
      // Header Title
      const titleBoxId = genId(`tb_title_${idx}`);
      requests.push({
        createShape: {
          objectId: titleBoxId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: {
              width: { magnitude: 600, unit: 'PT' },
              height: { magnitude: 45, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 60,
              translateY: 40,
              unit: 'PT',
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: titleBoxId,
          insertionIndex: 0,
          text: slide.title,
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: titleBoxId,
          textRange: { type: 'ALL' },
          style: {
            bold: true,
            fontSize: { magnitude: 24, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: textPrimaryRgb } },
            fontFamily: 'Montserrat',
          },
          fields: 'bold,fontSize,foregroundColor,fontFamily',
        },
      });

      // Big Stat Number
      const statNumBoxId = genId(`tb_stat_${idx}`);
      requests.push({
        createShape: {
          objectId: statNumBoxId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: {
              width: { magnitude: 600, unit: 'PT' },
              height: { magnitude: 110, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 60,
              translateY: 95,
              unit: 'PT',
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: statNumBoxId,
          insertionIndex: 0,
          text: slide.statNumber || '100%',
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: statNumBoxId,
          textRange: { type: 'ALL' },
          style: {
            bold: true,
            fontSize: { magnitude: 68, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: accentRgb } },
            fontFamily: 'Montserrat',
          },
          fields: 'bold,fontSize,foregroundColor,fontFamily',
        },
      });

      // Stat Label
      if (slide.statLabel) {
        const labelBoxId = genId(`tb_label_${idx}`);
        requests.push({
          createShape: {
            objectId: labelBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 35, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 60,
                translateY: 220,
                unit: 'PT',
              },
            },
          },
        });
        requests.push({
          insertText: {
            objectId: labelBoxId,
            insertionIndex: 0,
            text: slide.statLabel,
          },
        });
        requests.push({
          updateTextStyle: {
            objectId: labelBoxId,
            textRange: { type: 'ALL' },
            style: {
              bold: true,
              fontSize: { magnitude: 18, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: textPrimaryRgb } },
              fontFamily: 'Montserrat',
            },
            fields: 'bold,fontSize,foregroundColor,fontFamily',
          },
        });
      }

      // Content description
      if (slide.content && slide.content.length > 0) {
        const descBoxId = genId(`tb_desc_${idx}`);
        requests.push({
          createShape: {
            objectId: descBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: 600, unit: 'PT' },
                height: { magnitude: 90, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 60,
                translateY: 265,
                unit: 'PT',
              },
            },
          },
        });
        requests.push({
          insertText: {
            objectId: descBoxId,
            insertionIndex: 0,
            text: slide.content.map((c) => `•  ${c}`).join('\n\n'),
          },
        });
        requests.push({
          updateTextStyle: {
            objectId: descBoxId,
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 13, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: textSecondaryRgb } },
              fontFamily: 'Roboto',
            },
            fields: 'fontSize,foregroundColor,fontFamily',
          },
        });
      }
    } else if (slide.layout === 'quote') {
      // Big Quotation symbol
      const quoteMarkId = genId(`tb_qmark_${idx}`);
      requests.push({
        createShape: {
          objectId: quoteMarkId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: {
              width: { magnitude: 80, unit: 'PT' },
              height: { magnitude: 60, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 60,
              translateY: 60,
              unit: 'PT',
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: quoteMarkId,
          insertionIndex: 0,
          text: '“',
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: quoteMarkId,
          textRange: { type: 'ALL' },
          style: {
            bold: true,
            fontSize: { magnitude: 72, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: accentRgb } },
            fontFamily: 'Georgia',
          },
          fields: 'bold,fontSize,foregroundColor,fontFamily',
        },
      });

      // Quote Body
      const quoteBodyId = genId(`tb_qbody_${idx}`);
      const quoteText = slide.content.join(' ') || slide.title;
      requests.push({
        createShape: {
          objectId: quoteBodyId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: {
              width: { magnitude: 580, unit: 'PT' },
              height: { magnitude: 160, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 70,
              translateY: 120,
              unit: 'PT',
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: quoteBodyId,
          insertionIndex: 0,
          text: quoteText,
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: quoteBodyId,
          textRange: { type: 'ALL' },
          style: {
            italic: true,
            fontSize: { magnitude: 22, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: textPrimaryRgb } },
            fontFamily: 'Georgia',
          },
          fields: 'italic,fontSize,foregroundColor,fontFamily',
        },
      });

      // Author Citation
      if (slide.quoteAuthor) {
        const authorBoxId = genId(`tb_qauthor_${idx}`);
        requests.push({
          createShape: {
            objectId: authorBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: 580, unit: 'PT' },
                height: { magnitude: 40, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 70,
                translateY: 295,
                unit: 'PT',
              },
            },
          },
        });
        requests.push({
          insertText: {
            objectId: authorBoxId,
            insertionIndex: 0,
            text: `— ${slide.quoteAuthor}`,
          },
        });
        requests.push({
          updateTextStyle: {
            objectId: authorBoxId,
            textRange: { type: 'ALL' },
            style: {
              bold: true,
              fontSize: { magnitude: 15, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: accentRgb } },
              fontFamily: 'Montserrat',
            },
            fields: 'bold,fontSize,foregroundColor,fontFamily',
          },
        });
      }
    } else if (slide.layout === 'cards' && slide.columns && slide.columns.length > 0) {
      // Header Title
      const titleBoxId = genId(`tb_title_${idx}`);
      requests.push({
        createShape: {
          objectId: titleBoxId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: {
              width: { magnitude: 600, unit: 'PT' },
              height: { magnitude: 45, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 60,
              translateY: 35,
              unit: 'PT',
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: titleBoxId,
          insertionIndex: 0,
          text: slide.title,
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: titleBoxId,
          textRange: { type: 'ALL' },
          style: {
            bold: true,
            fontSize: { magnitude: 24, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: textPrimaryRgb } },
            fontFamily: 'Montserrat',
          },
          fields: 'bold,fontSize,foregroundColor,fontFamily',
        },
      });

      // Columns / Cards
      const cols = slide.columns.slice(0, 3);
      const totalWidth = 600;
      const gap = 20;
      const colWidth = (totalWidth - gap * (cols.length - 1)) / cols.length;

      cols.forEach((col, cIdx) => {
        const posX = 60 + cIdx * (colWidth + gap);

        // Background Box (Shape)
        const cardShapeId = genId(`card_bg_${idx}_${cIdx}`);
        requests.push({
          createShape: {
            objectId: cardShapeId,
            shapeType: 'RECTANGLE',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: colWidth, unit: 'PT' },
                height: { magnitude: 245, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: posX,
                translateY: 105,
                unit: 'PT',
              },
            },
          },
        });
        requests.push({
          updateShapeProperties: {
            objectId: cardShapeId,
            shapeProperties: {
              shapeBackgroundFill: {
                solidFill: { color: { rgbColor: cardBgRgb } },
              },
              outline: {
                outlineFill: {
                  solidFill: { color: { rgbColor: accentRgb } },
                },
                weight: { magnitude: 1, unit: 'PT' },
              },
            },
            fields:
              'shapeBackgroundFill.solidFill.color,outline.outlineFill.solidFill.color,outline.weight',
          },
        });

        // Column Text Box (Title + Description)
        const colTextBoxId = genId(`card_txt_${idx}_${cIdx}`);
        requests.push({
          createShape: {
            objectId: colTextBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: colWidth - 24, unit: 'PT' },
                height: { magnitude: 220, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: posX + 12,
                translateY: 115,
                unit: 'PT',
              },
            },
          },
        });
        const combinedColText = `${col.title}\n\n${col.description}`;
        requests.push({
          insertText: {
            objectId: colTextBoxId,
            insertionIndex: 0,
            text: combinedColText,
          },
        });
        // Overall styling
        requests.push({
          updateTextStyle: {
            objectId: colTextBoxId,
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 12, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: textSecondaryRgb } },
              fontFamily: 'Roboto',
            },
            fields: 'fontSize,foregroundColor,fontFamily',
          },
        });
        // Title style
        requests.push({
          updateTextStyle: {
            objectId: colTextBoxId,
            textRange: {
              type: 'FIXED_RANGE',
              startIndex: 0,
              endIndex: col.title.length,
            },
            style: {
              bold: true,
              fontSize: { magnitude: 16, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: textPrimaryRgb } },
              fontFamily: 'Montserrat',
            },
            fields: 'bold,fontSize,foregroundColor,fontFamily',
          },
        });
      });
    } else {
      // Default Bullets / Split layout
      const isSplitWithImage =
        slide.imageUrl &&
        slide.imageUrl.startsWith('https://') &&
        !slide.imageUrl.includes('localhost');
      const textWidth = isSplitWithImage ? 340 : 600;

      // Header Title
      const titleBoxId = genId(`tb_title_${idx}`);
      requests.push({
        createShape: {
          objectId: titleBoxId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideObjectId,
            size: {
              width: { magnitude: textWidth, unit: 'PT' },
              height: { magnitude: 50, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 60,
              translateY: 40,
              unit: 'PT',
            },
          },
        },
      });
      requests.push({
        insertText: {
          objectId: titleBoxId,
          insertionIndex: 0,
          text: slide.title || 'Diapositiva',
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: titleBoxId,
          textRange: { type: 'ALL' },
          style: {
            bold: true,
            fontSize: { magnitude: 26, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: textPrimaryRgb } },
            fontFamily: 'Montserrat',
          },
          fields: 'bold,fontSize,foregroundColor,fontFamily',
        },
      });

      // Subtitle
      let contentStartY = 100;
      if (slide.subtitle) {
        const subBoxId = genId(`tb_sub_${idx}`);
        requests.push({
          createShape: {
            objectId: subBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: textWidth, unit: 'PT' },
                height: { magnitude: 35, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 60,
                translateY: 90,
                unit: 'PT',
              },
            },
          },
        });
        requests.push({
          insertText: {
            objectId: subBoxId,
            insertionIndex: 0,
            text: slide.subtitle,
          },
        });
        requests.push({
          updateTextStyle: {
            objectId: subBoxId,
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 15, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: accentRgb } },
              fontFamily: 'Montserrat',
            },
            fields: 'fontSize,foregroundColor,fontFamily',
          },
        });
        contentStartY = 135;
      }

      // Content Bullets
      if (slide.content && slide.content.length > 0) {
        const contentBoxId = genId(`tb_cnt_${idx}`);
        const bulletsText = slide.content.map((c) => `•  ${c}`).join('\n\n');
        requests.push({
          createShape: {
            objectId: contentBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: textWidth, unit: 'PT' },
                height: { magnitude: 360 - contentStartY, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 60,
                translateY: contentStartY,
                unit: 'PT',
              },
            },
          },
        });
        requests.push({
          insertText: {
            objectId: contentBoxId,
            insertionIndex: 0,
            text: bulletsText,
          },
        });
        requests.push({
          updateTextStyle: {
            objectId: contentBoxId,
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: 14, unit: 'PT' },
              foregroundColor: { opaqueColor: { rgbColor: textPrimaryRgb } },
              fontFamily: 'Roboto',
            },
            fields: 'fontSize,foregroundColor,fontFamily',
          },
        });
      }

      // Right image if available and publicly accessible
      if (isSplitWithImage) {
        const imageElementId = genId(`img_${idx}`);
        requests.push({
          createImage: {
            objectId: imageElementId,
            url: slide.imageUrl!,
            elementProperties: {
              pageObjectId: slideObjectId,
              size: {
                width: { magnitude: 270, unit: 'PT' },
                height: { magnitude: 240, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 420,
                translateY: 80,
                unit: 'PT',
              },
            },
          },
        });
      }
    }
  });

  // 3. Delete default initial blank slide if one was created automatically
  if (initialSlideId) {
    requests.push({
      deleteObject: {
        objectId: initialSlideId,
      },
    });
  }

  // 4. Execute batchUpdate to build the presentation
  if (requests.length > 0) {
    const batchRes = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests,
        }),
      }
    );

    if (!batchRes.ok) {
      const errorData = await batchRes.json().catch(() => ({}));
      const message =
        errorData.error?.message ||
        `Errore durante la formattazione di Google Slides (${batchRes.status})`;
      console.warn('BatchUpdate warning:', message);
      // We still have the presentation created, but let user know if there was an issue
    }
  }

  const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  return {
    presentationId,
    presentationUrl,
    title: presentationTitle,
  };
}
