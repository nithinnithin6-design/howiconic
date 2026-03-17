import React, { useState, useRef, useCallback } from 'react';
import { BrandSystem } from '../types';
import * as api from '../api';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ProductionType = 'business-card' | 'social-post' | 'label' | 'letterhead' | 'email-signature';

interface ProductionItem {
  id: ProductionType;
  icon: string;
  label: string;
  desc: string;
}

const PRODUCTION_TYPES: ProductionItem[] = [
  { id: 'business-card', icon: '▣', label: 'Business Card', desc: 'Professional identity card' },
  { id: 'social-post', icon: '◈', label: 'Social Post', desc: 'Instagram, LinkedIn, Twitter' },
  { id: 'label', icon: '⊡', label: 'Label / Tag', desc: 'Garment & product labels' },
  { id: 'letterhead', icon: '◧', label: 'Letterhead', desc: 'Branded stationery' },
  { id: 'email-signature', icon: '◉', label: 'Email Signature', desc: 'HTML signature block' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getBrandColors(brand: BrandSystem | null) {
  return {
    primary: brand?.colors?.primary?.hex || '#f17022',
    secondary: brand?.colors?.secondary?.hex || '#1a1a1a',
    accent: brand?.colors?.accent?.hex || '#f5f5f5',
    canvas: brand?.colors?.canvasColor || '#0a0a0a',
  };
}

function getBrandFonts(brand: BrandSystem | null) {
  return {
    headline: brand?.typography?.hierarchy?.headline?.fontFamily || 'Playfair Display',
    body: brand?.typography?.hierarchy?.body?.fontFamily || 'Inter',
  };
}

function getLogo(brand: BrandSystem | null): string {
  return brand?.logoSystem?.primaryLogoSvg || brand?.logoSystem?.symbolOnlySvg || '';
}

// ─── PREVIEW COMPONENTS ───────────────────────────────────────────────────────

interface BusinessCardData {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
}

const BusinessCardPreview: React.FC<{ data: BusinessCardData; brand: BrandSystem | null }> = ({ data, brand }) => {
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logo = getLogo(brand);
  const brandName = brand?.name || 'BRAND';

  return (
    <div
      style={{
        width: 340,
        height: 200,
        background: '#fff',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        position: 'relative',
        fontFamily: fonts.body + ', sans-serif',
        flexShrink: 0,
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 5, background: colors.primary,
      }} />

      {/* Content area */}
      <div style={{ padding: '22px 20px 22px 24px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top: Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {logo ? (
            <div
              style={{ width: 28, height: 28, flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: logo }}
            />
          ) : (
            <div style={{
              width: 28, height: 28, background: colors.primary,
              borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 900, flexShrink: 0,
            }}>
              {brandName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#111' }}>
            {brandName}
          </span>
        </div>

        {/* Middle: Name + Title */}
        <div>
          <p style={{
            margin: 0,
            fontFamily: fonts.headline + ', serif',
            fontSize: 16, fontWeight: 900, color: '#111', lineHeight: 1.2,
          }}>
            {data.name || 'Your Name'}
          </p>
          <p style={{
            margin: '3px 0 0', fontSize: 9, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: colors.primary, fontWeight: 700,
          }}>
            {data.title || 'Your Title'}
          </p>
        </div>

        {/* Bottom: Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {data.phone && (
            <p style={{ margin: 0, fontSize: 8.5, color: '#555', letterSpacing: '0.04em' }}>
              {data.phone}
            </p>
          )}
          {data.email && (
            <p style={{ margin: 0, fontSize: 8.5, color: '#555', letterSpacing: '0.04em' }}>
              {data.email}
            </p>
          )}
          {data.website && (
            <p style={{ margin: 0, fontSize: 8.5, color: colors.primary, letterSpacing: '0.04em' }}>
              {data.website}
            </p>
          )}
        </div>
      </div>

      {/* Bottom color bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 4, background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
      }} />
    </div>
  );
};

// Back of card
const BusinessCardBack: React.FC<{ brand: BrandSystem | null }> = ({ brand }) => {
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logo = getLogo(brand);
  const brandName = brand?.name || 'BRAND';
  const tagline = brand?.voice?.tagline || '';

  return (
    <div style={{
      width: 340, height: 200,
      background: colors.primary,
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 12, flexShrink: 0,
    }}>
      {logo ? (
        <div style={{ width: 40, height: 40, filter: 'brightness(0) invert(1)' }}
          dangerouslySetInnerHTML={{ __html: logo }} />
      ) : (
        <div style={{
          width: 44, height: 44, background: 'rgba(255,255,255,0.2)',
          borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 900,
        }}>
          {brandName.substring(0, 2).toUpperCase()}
        </div>
      )}
      <p style={{
        margin: 0, fontFamily: fonts.headline + ', serif',
        fontSize: 18, fontWeight: 900, color: '#fff', textAlign: 'center',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {brandName}
      </p>
      {tagline && (
        <p style={{
          margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center',
          fontFamily: fonts.body + ', sans-serif',
        }}>
          {tagline}
        </p>
      )}
    </div>
  );
};

interface SocialPostData {
  platform: 'instagram' | 'linkedin' | 'twitter';
  copy: string;
  handle: string;
}

const SocialPostPreview: React.FC<{ data: SocialPostData; brand: BrandSystem | null }> = ({ data, brand }) => {
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logo = getLogo(brand);
  const brandName = brand?.name || 'BRAND';

  const dims: Record<string, { w: number; h: number; label: string }> = {
    instagram: { w: 320, h: 320, label: '1:1' },
    linkedin: { w: 320, h: 200, label: '16:9' },
    twitter: { w: 320, h: 180, label: '2:1' },
  };
  const { w, h } = dims[data.platform] || dims.instagram;

  return (
    <div style={{
      width: w, height: h,
      background: colors.primary,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 4px 32px rgba(0,0,0,0.22)',
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 24, boxSizing: 'border-box',
      flexShrink: 0,
    }}>
      {/* Background texture */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 80% 20%, ${colors.secondary}44 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      {/* Copy */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <p style={{
          margin: 0,
          fontFamily: fonts.headline + ', serif',
          fontSize: data.copy.length > 80 ? 14 : data.copy.length > 40 ? 18 : 22,
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1.35,
        }}>
          {data.copy || 'Your message here — make it count.'}
        </p>
      </div>

      {/* Bottom: logo + handle */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {logo ? (
            <div style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)', opacity: 0.7 }}
              dangerouslySetInnerHTML={{ __html: logo }} />
          ) : (
            <div style={{
              width: 20, height: 20, background: 'rgba(255,255,255,0.25)',
              borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 8, fontWeight: 900,
            }}>
              {brandName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span style={{
            fontSize: 9, fontFamily: fonts.body + ', sans-serif',
            color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em',
          }}>
            {data.handle ? `@${data.handle.replace('@', '')}` : `@${brandName.toLowerCase()}`}
          </span>
        </div>
        <span style={{
          fontSize: 7, letterSpacing: '0.25em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)', fontFamily: fonts.body + ', sans-serif',
          fontWeight: 700,
        }}>
          {dims[data.platform].label}
        </span>
      </div>
    </div>
  );
};

interface LabelData {
  productName: string;
  material: string;
  careInstructions: string;
  size: string;
  origin: string;
}

const LabelPreview: React.FC<{ data: LabelData; brand: BrandSystem | null }> = ({ data, brand }) => {
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logo = getLogo(brand);
  const brandName = brand?.name || 'BRAND';

  const careIcons: Record<string, string> = {
    'machine wash': '⊕ 30°',
    'hand wash': '☁',
    'dry clean': '○',
    'do not wash': '✕',
    'tumble dry': '◎',
    'iron low': '△ Low',
    'do not iron': '✕',
  };

  const careLines = data.careInstructions
    .split(/[,\n]/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div style={{
      width: 220, // label width
      background: '#fafafa',
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 2px 20px rgba(0,0,0,0.15)',
      border: '1px solid #e0e0e0',
      flexShrink: 0,
    }}>
      {/* Header band */}
      <div style={{
        background: colors.primary,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {logo ? (
          <div style={{ width: 22, height: 22, filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            dangerouslySetInnerHTML={{ __html: logo }} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 10, letterSpacing: '0.2em' }}>
            {brandName.substring(0, 3).toUpperCase()}
          </span>
        )}
        {data.size && (
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            color: '#fff', fontSize: 10, fontWeight: 900,
            padding: '2px 8px', borderRadius: 2, letterSpacing: '0.1em',
          }}>
            {data.size.toUpperCase()}
          </span>
        )}
      </div>

      {/* Product name */}
      <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #e8e8e8' }}>
        <p style={{
          margin: 0,
          fontFamily: fonts.headline + ', serif',
          fontSize: 13, fontWeight: 900, color: '#111',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {data.productName || 'Product Name'}
        </p>
        {data.material && (
          <p style={{ margin: '3px 0 0', fontSize: 8, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {data.material}
          </p>
        )}
      </div>

      {/* Care instructions */}
      <div style={{ padding: '8px 16px' }}>
        {careLines.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {careLines.map((line, i) => (
              <span key={i} style={{
                fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#666', background: '#f0f0f0',
                padding: '2px 6px', borderRadius: 2,
              }}>
                {careIcons[line] || line}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 7, color: '#bbb', letterSpacing: '0.1em' }}>
            CARE INSTRUCTIONS
          </p>
        )}
      </div>

      {/* Origin */}
      {data.origin && (
        <div style={{
          padding: '6px 16px 10px',
          borderTop: '1px solid #eee',
        }}>
          <p style={{ margin: 0, fontSize: 7, color: '#aaa', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Made in {data.origin}
          </p>
        </div>
      )}

      {/* Bottom color strip */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
    </div>
  );
};

interface LetterheadData {
  address: string;
  phone: string;
  email: string;
  website: string;
  date: string;
  recipientName: string;
  bodyText: string;
}

const LetterheadPreview: React.FC<{ data: LetterheadData; brand: BrandSystem | null }> = ({ data, brand }) => {
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logo = getLogo(brand);
  const brandName = brand?.name || 'BRAND';

  return (
    <div style={{
      width: 340,
      background: '#fff',
      borderRadius: 4,
      boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
      overflow: 'hidden',
      fontFamily: fonts.body + ', sans-serif',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        background: colors.primary,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {logo ? (
            <div style={{ width: 28, height: 28, filter: 'brightness(0) invert(1)' }}
              dangerouslySetInnerHTML={{ __html: logo }} />
          ) : (
            <div style={{
              width: 28, height: 28, background: 'rgba(255,255,255,0.2)',
              borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 10, fontWeight: 900,
            }}>
              {brandName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span style={{
            fontFamily: fonts.headline + ', serif',
            fontSize: 14, fontWeight: 900, color: '#fff',
            letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            {brandName}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          {data.phone && <p style={{ margin: 0, fontSize: 7, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>{data.phone}</p>}
          {data.email && <p style={{ margin: 0, fontSize: 7, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>{data.email}</p>}
          {data.website && <p style={{ margin: 0, fontSize: 7, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em' }}>{data.website}</p>}
        </div>
      </div>

      {/* Address strip */}
      {data.address && (
        <div style={{
          background: colors.secondary,
          padding: '5px 20px',
        }}>
          <p style={{ margin: 0, fontSize: 7, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {data.address}
          </p>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '18px 20px 20px' }}>
        {data.date && (
          <p style={{ margin: '0 0 10px', fontSize: 8.5, color: '#999', letterSpacing: '0.05em' }}>
            {data.date}
          </p>
        )}
        {data.recipientName && (
          <p style={{ margin: '0 0 12px', fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: '0.05em' }}>
            Dear {data.recipientName},
          </p>
        )}
        <p style={{
          margin: 0, fontSize: 8.5, color: '#444', lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
        }}>
          {data.bodyText || 'Your letter content here. This letterhead is ready for formal correspondence, proposals, and official communication.\n\nAll brand elements are applied consistently to reinforce your identity.'}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #eee',
        padding: '8px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ height: 3, width: 40, background: colors.primary, borderRadius: 2 }} />
        <p style={{ margin: 0, fontSize: 7, color: '#ccc', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {brandName}
        </p>
      </div>
    </div>
  );
};

interface EmailSigData {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
}

const EmailSignaturePreview: React.FC<{ data: EmailSigData; brand: BrandSystem | null }> = ({ data, brand }) => {
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logo = getLogo(brand);
  const brandName = brand?.name || 'BRAND';

  return (
    <div style={{
      maxWidth: 400,
      background: '#fff',
      borderRadius: 4,
      boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      fontFamily: fonts.body + ', Arial, sans-serif',
      flexShrink: 0,
    }}>
      <div style={{
        borderLeft: `4px solid ${colors.primary}`,
        padding: '16px 18px',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          {logo ? (
            <div style={{ width: 36, height: 36 }}
              dangerouslySetInnerHTML={{ __html: logo }} />
          ) : (
            <div style={{
              width: 36, height: 36, background: colors.primary,
              borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 900,
            }}>
              {brandName.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p style={{
            margin: 0,
            fontFamily: fonts.headline + ', serif',
            fontSize: 14, fontWeight: 900, color: '#111',
          }}>
            {data.name || 'Your Name'}
          </p>
          <p style={{
            margin: '2px 0 8px', fontSize: 9, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: colors.primary, fontWeight: 700,
          }}>
            {data.title || 'Your Title'} · {brandName}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.phone && (
              <p style={{ margin: 0, fontSize: 9, color: '#666' }}>
                <span style={{ color: colors.primary, fontWeight: 700 }}>T</span> {data.phone}
              </p>
            )}
            {data.email && (
              <p style={{ margin: 0, fontSize: 9, color: '#666' }}>
                <span style={{ color: colors.primary, fontWeight: 700 }}>E</span> {data.email}
              </p>
            )}
            {data.website && (
              <p style={{ margin: 0, fontSize: 9, color: colors.primary }}>
                <span style={{ fontWeight: 700 }}>W</span> {data.website}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }} />
    </div>
  );
};

// ─── HTML EXPORT FOR EMAIL SIGNATURE ──────────────────────────────────────────

function generateEmailSignatureHTML(data: EmailSigData, brand: BrandSystem | null): string {
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const brandName = brand?.name || 'BRAND';
  const logoSvg = getLogo(brand);

  const logoBlock = logoSvg
    ? `<div style="width:36px;height:36px;">${logoSvg}</div>`
    : `<div style="width:36px;height:36px;background:${colors.primary};border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:900;">${brandName.substring(0, 2).toUpperCase()}</div>`;

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fonts.body},Arial,sans-serif;">
  <tr>
    <td style="border-left:4px solid ${colors.primary};padding:16px 18px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top" style="padding-right:14px;">
            ${logoBlock}
          </td>
          <td valign="top">
            <p style="margin:0;font-family:${fonts.headline},serif;font-size:14px;font-weight:900;color:#111;">${data.name || 'Your Name'}</p>
            <p style="margin:2px 0 8px;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:${colors.primary};font-weight:700;">${data.title || 'Your Title'} · ${brandName}</p>
            ${data.phone ? `<p style="margin:0 0 2px;font-size:9px;color:#666;"><span style="color:${colors.primary};font-weight:700;">T</span> ${data.phone}</p>` : ''}
            ${data.email ? `<p style="margin:0 0 2px;font-size:9px;color:#666;"><span style="color:${colors.primary};font-weight:700;">E</span> ${data.email}</p>` : ''}
            ${data.website ? `<p style="margin:0;font-size:9px;color:${colors.primary};"><span style="font-weight:700;">W</span> ${data.website}</p>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="height:3px;background:linear-gradient(90deg,${colors.primary},${colors.secondary});"></td>
  </tr>
</table>`;
}

// ─── FIELD COMPONENT ──────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}> = ({ label, value, onChange, placeholder, multiline }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{
      fontSize: 9, fontWeight: 900, letterSpacing: '0.25em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
    }}>
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: '10px 12px',
          color: '#fff',
          fontSize: 13,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          resize: 'vertical',
          lineHeight: 1.5,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = '#f17022'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: '10px 12px',
          color: '#fff',
          fontSize: 13,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = '#f17022'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
    )}
  </div>
);

// ─── MAIN STUDIO VIEW ─────────────────────────────────────────────────────────

interface StudioViewProps {
  brand: BrandSystem | null;
}

const StudioView: React.FC<StudioViewProps> = ({ brand }) => {
  const [activeType, setActiveType] = useState<ProductionType>('business-card');
  const [copyMsg, setCopyMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Business card state
  const [cardData, setCardData] = useState<BusinessCardData>({
    name: '', title: '', phone: '', email: '', website: '',
  });

  // Social post state
  const [socialData, setSocialData] = useState<SocialPostData>({
    platform: 'instagram', copy: '', handle: '',
  });

  // Label state
  const [labelData, setLabelData] = useState<LabelData>({
    productName: '', material: '', careInstructions: '', size: '', origin: '',
  });

  // Letterhead state
  const [letterData, setLetterData] = useState<LetterheadData>({
    address: '', phone: '', email: '', website: '',
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    recipientName: '', bodyText: '',
  });

  // Email sig state
  const [sigData, setSigData] = useState<EmailSigData>({
    name: '', title: '', phone: '', email: '', website: '',
  });

  const previewRef = useRef<HTMLDivElement>(null);

  const copyEmailSignatureHTML = useCallback(() => {
    const html = generateEmailSignatureHTML(sigData, brand);
    navigator.clipboard.writeText(html).then(() => {
      setCopyMsg('HTML copied!');
      setTimeout(() => setCopyMsg(''), 2500);
    }).catch(() => {
      setCopyMsg('Copy failed — try manually');
      setTimeout(() => setCopyMsg(''), 2500);
    });
  }, [sigData, brand]);

  const noBrand = !brand;

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 64px)',
      background: '#0a0a0a',
    }}>

      {/* ── LEFT SIDEBAR: production types ── */}
      <aside style={{
        width: 200,
        flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <p style={{
          margin: '0 0 12px',
          padding: '0 16px',
          fontSize: 8, fontWeight: 900,
          letterSpacing: '0.5em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
        }}>
          Collateral
        </p>
        {PRODUCTION_TYPES.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveType(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 16px',
              background: activeType === p.id ? 'rgba(241,112,34,0.08)' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${activeType === p.id ? '#f17022' : 'transparent'}`,
              cursor: 'pointer',
              width: '100%', textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (activeType !== p.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
            onMouseLeave={e => {
              if (activeType !== p.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{
              fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0,
              color: activeType === p.id ? '#f17022' : 'rgba(255,255,255,0.4)',
            }}>
              {p.icon}
            </span>
            <div>
              <p style={{
                margin: 0, fontSize: 10, fontWeight: 900,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: activeType === p.id ? '#f17022' : 'rgba(255,255,255,0.7)',
              }}>
                {p.label}
              </p>
              <p style={{
                margin: 0, fontSize: 7.5, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.06em',
              }}>
                {p.desc}
              </p>
            </div>
          </button>
        ))}
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        {/* Kee */}
        <div style={{
          background: 'rgba(241,112,34,0.04)',
          borderLeft: '3px solid #f17022',
          borderRadius: '0 12px 12px 0',
          padding: '14px 18px 16px',
          margin: '24px 24px 0', maxWidth: 520,
        }}>
          <p style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: '#f17022', margin: '0 0 6px',
          }}>Kee</p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {noBrand ? 'Build a brand first, then come here to create designs from it.' : 'The studio is where your brand comes to life. Social posts, business cards, presentations — all guided by your brand system.'}
          </p>
        </div>

        {/* No brand warning */}
        {noBrand && (
          <div style={{
            margin: '24px 24px 0',
            padding: '12px 16px',
            background: 'rgba(241,112,34,0.06)',
            border: '1px solid rgba(241,112,34,0.2)',
            borderRadius: 8,
          }}>
            <p style={{
              margin: 0, fontSize: 11,
              color: 'rgba(241,112,34,0.8)',
              fontWeight: 700, letterSpacing: '0.05em',
            }}>
              Open a brand from the Vault to use its colors, fonts, and logo in your designs.
            </p>
          </div>
        )}

        {/* Content area: form + preview side by side */}
        <div style={{
          display: 'flex',
          gap: 0,
          flex: 1,
          flexWrap: 'wrap',
        }}>

          {/* Form panel */}
          <div style={{
            width: 300,
            flexShrink: 0,
            padding: '28px 24px',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {/* Section header */}
            <div style={{ marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                {PRODUCTION_TYPES.find(p => p.id === activeType)?.label}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                {PRODUCTION_TYPES.find(p => p.id === activeType)?.desc}
              </p>
            </div>

            {/* BUSINESS CARD FORM */}
            {activeType === 'business-card' && (
              <>
                <Field label="Full Name" value={cardData.name} onChange={v => setCardData(p => ({ ...p, name: v }))} placeholder="John Smith" />
                <Field label="Title" value={cardData.title} onChange={v => setCardData(p => ({ ...p, title: v }))} placeholder="Creative Director" />
                <Field label="Phone" value={cardData.phone} onChange={v => setCardData(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" />
                <Field label="Email" value={cardData.email} onChange={v => setCardData(p => ({ ...p, email: v }))} placeholder="john@company.com" />
                <Field label="Website" value={cardData.website} onChange={v => setCardData(p => ({ ...p, website: v }))} placeholder="www.company.com" />
              </>
            )}

            {/* SOCIAL POST FORM */}
            {activeType === 'social-post' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                    Platform
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['instagram', 'linkedin', 'twitter'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setSocialData(prev => ({ ...prev, platform: p }))}
                        style={{
                          flex: 1, padding: '7px 4px',
                          background: socialData.platform === p ? 'rgba(241,112,34,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${socialData.platform === p ? '#f17022' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 6, cursor: 'pointer',
                          fontSize: 8.5, fontWeight: 900,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: socialData.platform === p ? '#f17022' : 'rgba(255,255,255,0.4)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Copy" value={socialData.copy} onChange={v => setSocialData(p => ({ ...p, copy: v }))} placeholder="Your message here — make it count." multiline />
                <Field label="Handle" value={socialData.handle} onChange={v => setSocialData(p => ({ ...p, handle: v }))} placeholder="yourbrand" />
              </>
            )}

            {/* LABEL FORM */}
            {activeType === 'label' && (
              <>
                <Field label="Product Name" value={labelData.productName} onChange={v => setLabelData(p => ({ ...p, productName: v }))} placeholder="Premium Compression Tee" />
                <Field label="Material" value={labelData.material} onChange={v => setLabelData(p => ({ ...p, material: v }))} placeholder="80% Polyester, 20% Spandex" />
                <Field label="Size" value={labelData.size} onChange={v => setLabelData(p => ({ ...p, size: v }))} placeholder="M" />
                <Field label="Care Instructions" value={labelData.careInstructions} onChange={v => setLabelData(p => ({ ...p, careInstructions: v }))} placeholder="Machine wash, Tumble dry, Do not iron" multiline />
                <Field label="Country of Origin" value={labelData.origin} onChange={v => setLabelData(p => ({ ...p, origin: v }))} placeholder="India" />
              </>
            )}

            {/* LETTERHEAD FORM */}
            {activeType === 'letterhead' && (
              <>
                <Field label="Address" value={letterData.address} onChange={v => setLetterData(p => ({ ...p, address: v }))} placeholder="123 Brand Street, Mumbai 400001" />
                <Field label="Phone" value={letterData.phone} onChange={v => setLetterData(p => ({ ...p, phone: v }))} placeholder="+91 22 1234 5678" />
                <Field label="Email" value={letterData.email} onChange={v => setLetterData(p => ({ ...p, email: v }))} placeholder="hello@brand.com" />
                <Field label="Website" value={letterData.website} onChange={v => setLetterData(p => ({ ...p, website: v }))} placeholder="www.brand.com" />
                <Field label="Date" value={letterData.date} onChange={v => setLetterData(p => ({ ...p, date: v }))} placeholder="16 March 2026" />
                <Field label="Recipient Name" value={letterData.recipientName} onChange={v => setLetterData(p => ({ ...p, recipientName: v }))} placeholder="Mr. John Smith" />
                <Field label="Body Text" value={letterData.bodyText} onChange={v => setLetterData(p => ({ ...p, bodyText: v }))} placeholder="Write your letter content here..." multiline />
              </>
            )}

            {/* EMAIL SIGNATURE FORM */}
            {activeType === 'email-signature' && (
              <>
                <Field label="Full Name" value={sigData.name} onChange={v => setSigData(p => ({ ...p, name: v }))} placeholder="John Smith" />
                <Field label="Title" value={sigData.title} onChange={v => setSigData(p => ({ ...p, title: v }))} placeholder="Creative Director" />
                <Field label="Phone" value={sigData.phone} onChange={v => setSigData(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" />
                <Field label="Email" value={sigData.email} onChange={v => setSigData(p => ({ ...p, email: v }))} placeholder="john@company.com" />
                <Field label="Website" value={sigData.website} onChange={v => setSigData(p => ({ ...p, website: v }))} placeholder="www.company.com" />
              </>
            )}
          </div>

          {/* Preview panel */}
          <div style={{
            flex: 1,
            minWidth: 300,
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{
                margin: 0, fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.2)', fontWeight: 700,
              }}>
                Live Preview
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {activeType === 'email-signature' && (
                  <button
                    onClick={copyEmailSignatureHTML}
                    style={{
                      padding: '7px 14px',
                      background: copyMsg ? 'rgba(255,255,255,0.08)' : 'rgba(241,112,34,0.12)',
                      border: `1px solid ${copyMsg ? 'rgba(255,255,255,0.15)' : 'rgba(241,112,34,0.3)'}`,
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: copyMsg ? 'rgba(255,255,255,0.5)' : '#f17022',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copyMsg || 'Copy HTML'}
                  </button>
                )}
                <span style={{
                  fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.15)', fontWeight: 700,
                }}>
                  Screenshot to save
                </span>
              </div>
            </div>

            {/* The preview output */}
            <div
              ref={previewRef}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              {activeType === 'business-card' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 7, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Front</p>
                    <BusinessCardPreview data={cardData} brand={brand} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 7, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Back</p>
                    <BusinessCardBack brand={brand} />
                  </div>
                </>
              )}

              {activeType === 'social-post' && (
                <SocialPostPreview data={socialData} brand={brand} />
              )}

              {activeType === 'label' && (
                <LabelPreview data={labelData} brand={brand} />
              )}

              {activeType === 'letterhead' && (
                <LetterheadPreview data={letterData} brand={brand} />
              )}

              {activeType === 'email-signature' && (
                <EmailSignaturePreview data={sigData} brand={brand} />
              )}
            </div>

            {/* Usage hint */}
            <div style={{
              marginTop: 8,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 8,
            }}>
              <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                {activeType === 'email-signature'
                  ? '→ Click "Copy HTML" then paste into Gmail/Outlook Settings → Signature.'
                  : '→ Take a screenshot of the preview above to save your design. Use browser zoom to adjust scale.'}
              </p>
            </div>

            {/* Brand context */}
            {brand && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(241,112,34,0.03)',
                border: '1px solid rgba(241,112,34,0.08)',
                borderRadius: 8,
                display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
              }}>
                <span style={{ fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                  Brand:
                </span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#f17022', letterSpacing: '0.1em' }}>
                  {brand.name}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[brand.colors?.primary?.hex, brand.colors?.secondary?.hex, brand.colors?.accent?.hex].filter(Boolean).map((hex, i) => (
                    <div key={i} style={{
                      width: 14, height: 14, borderRadius: 3,
                      background: hex, border: '1px solid rgba(255,255,255,0.1)',
                    }} title={hex} />
                  ))}
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                  {brand.typography?.hierarchy?.headline?.fontFamily || 'Playfair Display'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioView;
