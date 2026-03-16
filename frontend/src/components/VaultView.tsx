import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandSystem } from '../types';
import LogoRenderer from './LogoRenderer';
import * as api from '../api';

// ─── EMPTY STATE ILLUSTRATION ─────────────────────────────────────────────────
const VaultEmptyIllustration = () => (
  <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: 180, height: 180, margin: '0 auto', display: 'block', opacity: 0.18 }}>
    <circle cx="120" cy="120" r="100" stroke="white" strokeWidth="0.5" strokeDasharray="6 6" />
    <circle cx="120" cy="120" r="65" stroke="white" strokeWidth="0.5" />
    <circle cx="120" cy="120" r="30" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" />
    <g transform="translate(120, 120)">
      {[0, 60, 120, 180, 240, 300].map(a => (
        <path key={a} d="M0 0 C-5 -8, -8 -22, 0 -30 C8 -22, 5 -8, 0 0 Z"
          fill="white" opacity="0.25" transform={`rotate(${a})`} />
      ))}
      <circle cx="0" cy="0" r="5" fill="#f17022" opacity="0.7" />
    </g>
    <path d="M70 170 L120 190 L170 170" stroke="white" strokeWidth="0.5" opacity="0.25" />
    <path d="M85 180 L120 195 L155 180" stroke="white" strokeWidth="0.5" opacity="0.15" />
    <rect x="100" y="60" width="40" height="40" rx="2" stroke="white" strokeWidth="0.5" opacity="0.2" />
    <rect x="110" y="70" width="20" height="20" rx="1" stroke="white" strokeWidth="0.5" opacity="0.15" />
  </svg>
);

// ─── EDUCATION TIPS (for empty state) ────────────────────────────────────────
const EMPTY_TIPS = [
  { icon: '🏆', text: 'Brands with consistent identity are 3.5x more visible than those without.' },
  { icon: '💡', text: 'Coined names like Spotify and Kodak are legally stronger — they own their entire category.' },
  { icon: '🎨', text: '85% of purchasing decisions are influenced by color. Every shade in your system matters.' },
];

// ─── BRAND STATUS ─────────────────────────────────────────────────────────────
type BrandStatus = 'active' | 'draft' | 'archived';

function getBrandStatus(brand: BrandSystem): BrandStatus {
  return (brand as any).status || 'active';
}

const StatusDot: React.FC<{ status: BrandStatus }> = ({ status }) => {
  const colors = {
    active: '#22c55e',
    draft: '#eab308',
    archived: '#6b7280',
  };
  const labels = { active: 'Active', draft: 'Draft', archived: 'Archived' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: colors[status],
        boxShadow: status === 'active' ? `0 0 6px ${colors[status]}` : 'none',
        flexShrink: 0,
        display: 'inline-block',
      }} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
        {labels[status]}
      </span>
    </span>
  );
};

// ─── ARCHITECTURE TREE ────────────────────────────────────────────────────────
interface BrandTreeNode {
  brand: BrandSystem;
  children: BrandTreeNode[];
}

function buildTree(brands: BrandSystem[]): BrandTreeNode[] {
  const map = new Map<string | number, BrandTreeNode>();
  const roots: BrandTreeNode[] = [];

  // Create nodes
  brands.forEach(b => {
    const key = b.uid || b.id || '';
    map.set(key, { brand: b, children: [] });
  });

  // Build tree
  brands.forEach(b => {
    const parentId = (b as any).parent_brand_id;
    const key = b.uid || b.id || '';
    const node = map.get(key)!;
    if (parentId) {
      const parent = map.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function hasSubBrands(brands: BrandSystem[]): boolean {
  return brands.some(b => !!(b as any).parent_brand_id);
}

const TreeNode: React.FC<{
  node: BrandTreeNode;
  depth: number;
  onOpen: (brand: BrandSystem) => void;
}> = ({ node, depth, onOpen }) => (
  <div style={{ marginLeft: depth * 24 }}>
    <button
      onClick={() => onOpen(node.brand)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 0', width: '100%', textAlign: 'left',
      }}
    >
      {depth > 0 && (
        <span style={{ color: 'rgba(241,112,34,0.4)', fontSize: 12 }}>└─</span>
      )}
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: node.brand.colors?.primary?.hex || '#f17022',
      }} />
      <span style={{
        fontFamily: 'Playfair Display, serif', fontWeight: 700,
        fontSize: 14, color: '#fff',
        textTransform: 'uppercase',
      }}>
        {node.brand.name}
      </span>
      {depth > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '1px 6px', borderRadius: 2,
        }}>Sub-brand</span>
      )}
    </button>
    {node.children.map((child, i) => (
      <TreeNode key={i} node={child} depth={depth + 1} onOpen={onOpen} />
    ))}
  </div>
);

// ─── VAULT VIEW ───────────────────────────────────────────────────────────────

interface VaultViewProps {
  brands: BrandSystem[];
  onOpen: (brand: BrandSystem) => void;
  onNewBrand: () => void;
  onDelete?: (brand: BrandSystem, index: number) => void;
  compareMode?: boolean;
  compareIds?: string[];
  onToggleCompare?: () => void;
  onSelectCompare?: (id: string) => void;
  onStartCompare?: () => void;
}

const VaultView: React.FC<VaultViewProps> = ({
  brands,
  onOpen,
  onNewBrand,
  onDelete,
  compareMode = false,
  compareIds = [],
  onToggleCompare,
  onSelectCompare,
  onStartCompare,
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortMode, setSortMode] = useState<'newest' | 'alpha'>('newest');
  const [showTree, setShowTree] = useState(false);

  const filtered = useMemo(() => {
    let result = [...brands];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b => b.name?.toLowerCase().includes(q) || b.voice?.tagline?.toLowerCase().includes(q));
    }
    if (sortMode === 'alpha') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    // newest first is default order (brands come in newest-first from API)
    return result;
  }, [brands, search, sortMode]);

  const tree = useMemo(() => buildTree(brands), [brands]);
  const hasTree = hasSubBrands(brands);

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '64px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
        <h2 style={{
          fontFamily: 'Playfair Display, serif', fontWeight: 900,
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          color: '#fff', textTransform: 'uppercase', fontStyle: 'italic',
          lineHeight: 0.95, margin: 0,
        }}>
          Brand Vault
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {brands.length >= 2 && (
            <>
              {compareMode && compareIds.length === 2 && (
                <button
                  onClick={onStartCompare}
                  style={{
                    padding: '10px 20px',
                    background: '#fff', color: '#000',
                    border: 'none', cursor: 'pointer',
                    fontSize: 10, fontWeight: 900, letterSpacing: '0.3em',
                    textTransform: 'uppercase', borderRadius: 100,
                  }}
                >
                  Compare →
                </button>
              )}
              <button
                onClick={onToggleCompare}
                style={{
                  padding: '10px 20px',
                  background: compareMode ? 'rgba(241,112,34,0.08)' : 'transparent',
                  color: compareMode ? '#f17022' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${compareMode ? 'rgba(241,112,34,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  cursor: 'pointer',
                  fontSize: 10, fontWeight: 900, letterSpacing: '0.3em',
                  textTransform: 'uppercase', borderRadius: 100,
                  transition: 'all 0.2s ease',
                }}
              >
                {compareMode ? `Select ${2 - compareIds.length} more` : '⇆ Compare'}
              </button>
            </>
          )}

          <button
            onClick={onNewBrand}
            style={{
              padding: '12px 24px',
              background: '#f17022', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 900, letterSpacing: '0.3em',
              textTransform: 'uppercase', borderRadius: 100,
              boxShadow: '0 8px 24px rgba(241,112,34,0.25)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#d95e15'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f17022'; }}
          >
            + New Brand
          </button>
        </div>
      </div>

      {/* Compare hint */}
      {compareMode && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase',
            fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginBottom: 24,
          }}
        >
          Select 2 brands to compare side by side
        </motion.p>
      )}

      {/* Controls */}
      {brands.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 32,
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: 200, maxWidth: 360 }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.2)', fontSize: 14,
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2, padding: '10px 14px 10px 36px',
                color: '#fff', fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                outline: 'none', transition: 'border-color 0.2s ease',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(241,112,34,0.4)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', gap: 2 }}>
            {(['newest', 'alpha'] as const).map(m => (
              <button
                key={m}
                onClick={() => setSortMode(m)}
                style={{
                  padding: '8px 14px', cursor: 'pointer',
                  background: sortMode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: sortMode === m ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  borderRadius: m === 'newest' ? '2px 0 0 2px' : '0 2px 2px 0',
                  transition: 'all 0.2s ease',
                }}
              >
                {m === 'newest' ? 'Newest' : 'A–Z'}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 2 }}>
            {(['grid', 'list'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  padding: '8px 12px', cursor: 'pointer',
                  background: viewMode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: viewMode === m ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 14,
                  borderRadius: m === 'grid' ? '2px 0 0 2px' : '0 2px 2px 0',
                  transition: 'all 0.2s ease',
                }}
                title={m === 'grid' ? 'Grid view' : 'List view'}
              >
                {m === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>

          {/* Architecture tree toggle */}
          {hasTree && (
            <button
              onClick={() => setShowTree(!showTree)}
              style={{
                padding: '8px 14px', cursor: 'pointer',
                background: showTree ? 'rgba(241,112,34,0.08)' : 'transparent',
                color: showTree ? '#f17022' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${showTree ? 'rgba(241,112,34,0.3)' : 'rgba(255,255,255,0.08)'}`,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.3em',
                textTransform: 'uppercase', borderRadius: 2,
                transition: 'all 0.2s ease',
              }}
            >
              🌳 Architecture
            </button>
          )}
        </div>
      )}

      {/* Architecture tree view */}
      <AnimatePresence>
        {showTree && hasTree && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 2, padding: 24, marginBottom: 32, overflow: 'hidden',
            }}
          >
            <p style={{
              fontSize: 9, letterSpacing: '0.6em', textTransform: 'uppercase',
              fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginBottom: 16,
            }}>
              Brand Architecture
            </p>
            {tree.map((node, i) => (
              <TreeNode key={i} node={node} depth={0} onOpen={onOpen} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {brands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 16px' }}>
          <VaultEmptyIllustration />
          <div style={{ marginTop: 40 }}>
            <h3 style={{
              fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 28,
              color: 'rgba(255,255,255,0.8)', marginBottom: 16, textTransform: 'uppercase',
            }}>
              Your brand vault is empty
            </h3>
            <p style={{
              fontStyle: 'italic', color: 'rgba(255,255,255,0.35)',
              fontSize: 16, maxWidth: 400, margin: '0 auto 40px',
              lineHeight: 1.7, fontFamily: 'Georgia, serif',
            }}>
              Every iconic brand starts with a single idea. Ready to build yours?
            </p>
            <button
              onClick={onNewBrand}
              style={{
                padding: '16px 40px',
                background: '#f17022', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 900, letterSpacing: '0.4em',
                textTransform: 'uppercase', borderRadius: 100,
                boxShadow: '0 12px 40px rgba(241,112,34,0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Create Your First Brand →
            </button>
          </div>

          {/* Education tips */}
          <div style={{
            display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
            marginTop: 64, maxWidth: 800, margin: '64px auto 0',
          }}>
            {EMPTY_TIPS.map((tip, i) => (
              <div key={i} style={{
                flex: '1', minWidth: 200, maxWidth: 240,
                padding: '20px 16px',
                background: 'rgba(241,112,34,0.03)',
                borderLeft: '2px solid rgba(241,112,34,0.2)',
                textAlign: 'left',
              }}>
                <span style={{ fontSize: 20, display: 'block', marginBottom: 10 }}>{tip.icon}</span>
                <p style={{
                  fontSize: 12, fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
                  fontFamily: 'Georgia, serif',
                }}>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 16px' }}>
          <p style={{
            fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)',
            fontFamily: 'Georgia, serif',
          }}>
            No brands match "{search}"
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID VIEW ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {filtered.map((brand, i) => {
            const brandKey = brand.uid || String(brand.id) || String(i);
            const isSelected = compareIds.includes(brandKey);
            const isDisabled = compareMode && compareIds.length === 2 && !isSelected;
            const status = getBrandStatus(brand);
            const primaryHex = brand.colors?.primary?.hex || '#f17022';
            const parentBrandId = (brand as any).parent_brand_id;

            return (
              <motion.div
                key={brandKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'relative',
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${isSelected ? 'rgba(241,112,34,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  opacity: isDisabled ? 0.35 : 1,
                  cursor: compareMode ? (isDisabled ? 'not-allowed' : 'pointer') : 'default',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 0 2px rgba(241,112,34,0.25)' : 'none',
                }}
                onClick={() => {
                  if (!compareMode || isDisabled) return;
                  onSelectCompare?.(brandKey);
                }}
                onMouseEnter={e => {
                  if (!isDisabled) {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLElement).style.borderColor = isSelected
                      ? 'rgba(241,112,34,0.7)'
                      : 'rgba(255,255,255,0.2)';
                    (e.currentTarget as HTMLElement).style.boxShadow = isSelected
                      ? '0 0 0 2px rgba(241,112,34,0.3), 0 12px 40px rgba(0,0,0,0.4)'
                      : '0 12px 40px rgba(0,0,0,0.4)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.borderColor = isSelected
                    ? 'rgba(241,112,34,0.5)'
                    : 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.boxShadow = isSelected
                    ? '0 0 0 2px rgba(241,112,34,0.25)'
                    : 'none';
                }}
              >
                {/* Compare checkbox */}
                {compareMode && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 10,
                    width: 22, height: 22, borderRadius: '50%',
                    background: isSelected ? '#f17022' : 'transparent',
                    border: `2px solid ${isSelected ? '#f17022' : 'rgba(255,255,255,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                )}

                {/* Accent bar left */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: primaryHex,
                  opacity: 0.6,
                }} />

                {/* Logo preview */}
                <div style={{
                  background: brand.colors?.canvasColor || '#0a0a0a',
                  padding: '32px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 120,
                }}>
                  {brand.logoSystem?.primaryLogoSvg ? (
                    <LogoRenderer svg={brand.logoSystem.primaryLogoSvg} className="w-16 h-16" primaryColor={primaryHex} />
                  ) : (
                    <span style={{
                      fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
                      fontWeight: 900, fontSize: 36, color: primaryHex,
                    }}>
                      {brand.name?.substring(0, 2) || '?'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '20px 20px 20px 24px' }}>
                  {/* Name + badges */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <h3 style={{
                      fontFamily: 'Playfair Display, serif', fontWeight: 900,
                      fontSize: 22, color: '#fff', textTransform: 'uppercase',
                      margin: 0, lineHeight: 1.1,
                    }}>
                      {brand.name}
                    </h3>
                    <StatusDot status={status} />
                  </div>

                  {/* Tagline */}
                  {brand.voice?.tagline ? (
                    <p style={{
                      fontStyle: 'italic', color: 'rgba(255,255,255,0.35)',
                      fontSize: 12, marginBottom: 14, lineHeight: 1.5,
                      fontFamily: 'Georgia, serif',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      "{brand.voice.tagline}"
                    </p>
                  ) : (
                    <p style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.4em',
                      textTransform: 'uppercase', color: 'rgba(241,112,34,0.6)',
                      marginBottom: 14,
                    }}>
                      {brand.sense}
                    </p>
                  )}

                  {/* Brand type badge */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: parentBrandId ? 'rgba(241,112,34,0.7)' : 'rgba(255,255,255,0.2)',
                      border: `1px solid ${parentBrandId ? 'rgba(241,112,34,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      padding: '2px 8px', borderRadius: 2,
                    }}>
                      {parentBrandId ? '↳ Sub-brand' : 'Standalone'}
                    </span>
                  </div>

                  {/* Color palette — 5 circles */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {[
                      brand.colors?.primary?.hex,
                      brand.colors?.secondary?.hex,
                      brand.colors?.accent?.hex,
                      brand.colors?.canvasColor,
                      brand.colors?.primary?.hex, // repeat primary as 5th
                    ].filter(Boolean).slice(0, 5).map((hex, ci) => (
                      <div
                        key={ci}
                        title={hex}
                        style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: hex,
                          border: '1px solid rgba(255,255,255,0.1)',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  {!compareMode && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => onOpen(brand)}
                        style={{
                          flex: 1, padding: '10px 0',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff', cursor: 'pointer',
                          fontSize: 10, fontWeight: 900, letterSpacing: '0.3em',
                          textTransform: 'uppercase', borderRadius: 100,
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                      >
                        Open →
                      </button>

                      {onDelete && (
                        <button
                          onClick={async () => {
                            if (brand.id) { try { await api.deleteBrand(String(brand.id)); } catch {} }
                            onDelete(brand, i);
                          }}
                          style={{
                            width: 36, height: 36,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                            fontSize: 14, borderRadius: '50%',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                          title="Archive"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 160px 100px 80px',
            gap: 16, padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {['Brand', 'Colors', 'Type', 'Status'].map(h => (
              <span key={h} style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.4em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
              }}>{h}</span>
            ))}
          </div>

          {filtered.map((brand, i) => {
            const brandKey = brand.uid || String(brand.id) || String(i);
            const isSelected = compareIds.includes(brandKey);
            const isDisabled = compareMode && compareIds.length === 2 && !isSelected;
            const status = getBrandStatus(brand);
            const primaryHex = brand.colors?.primary?.hex || '#f17022';
            const parentBrandId = (brand as any).parent_brand_id;

            return (
              <motion.div
                key={brandKey}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px 100px 80px',
                  gap: 16, padding: '14px 16px',
                  border: `1px solid ${isSelected ? 'rgba(241,112,34,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 2,
                  alignItems: 'center',
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isSelected ? 'rgba(241,112,34,0.03)' : 'transparent',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = isSelected
                    ? 'rgba(241,112,34,0.3)' : 'rgba(255,255,255,0.06)';
                }}
                onClick={() => {
                  if (compareMode) {
                    if (!isDisabled) onSelectCompare?.(brandKey);
                  } else {
                    onOpen(brand);
                  }
                }}
              >
                {/* Name + tagline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: primaryHex,
                  }} />
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{
                      fontFamily: 'Playfair Display, serif', fontWeight: 900,
                      fontSize: 16, color: '#fff', textTransform: 'uppercase',
                      margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {brand.name}
                    </p>
                    {brand.voice?.tagline && (
                      <p style={{
                        fontSize: 11, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)',
                        margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        fontFamily: 'Georgia, serif',
                      }}>
                        {brand.voice.tagline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Colors */}
                <div style={{ display: 'flex', gap: 5 }}>
                  {[brand.colors?.primary?.hex, brand.colors?.secondary?.hex, brand.colors?.accent?.hex]
                    .filter(Boolean).map((hex, ci) => (
                      <div key={ci} style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: hex, border: '1px solid rgba(255,255,255,0.1)',
                      }} />
                    ))}
                </div>

                {/* Type */}
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: parentBrandId ? 'rgba(241,112,34,0.6)' : 'rgba(255,255,255,0.25)',
                }}>
                  {parentBrandId ? 'Sub-brand' : 'Standalone'}
                </span>

                {/* Status */}
                <StatusDot status={status} />
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default VaultView;
