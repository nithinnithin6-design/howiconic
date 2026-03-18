import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api';
import { BrandSystem } from '../types';
import KeeAlive from './KeeAlive';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ArchNode {
  id: number;
  name: string;
  uid: string;
  brand_type: string;
  relationship_type?: string;
  position?: number;
  brand_data: any;
  children: ArchNode[];
}

interface CreateSubBrandForm {
  name: string;
  relationship_type: string;
}

const RELATIONSHIP_TYPES = ['endorsed', 'standalone', 'extension', 'product-line', 'sub-brand'];

// ─── TREE NODE ────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: ArchNode;
  depth: number;
  isLast: boolean;
  onSelect: (node: ArchNode) => void;
  onCreateChild: (node: ArchNode) => void;
  selectedId: number | null;
}

const RelBadge: React.FC<{ type: string }> = ({ type }) => {
  const colorMap: Record<string, string> = {
    endorsed: '#f17022',
    standalone: 'rgba(255,255,255,0.4)',
    extension: '#7dd3fc',
    'product-line': '#86efac',
    'sub-brand': 'rgba(241,112,34,0.7)',
  };
  const color = colorMap[type] || 'rgba(255,255,255,0.3)';
  return (
    <span style={{
      fontSize: 7,
      fontWeight: 900,
      letterSpacing: '0.25em',
      textTransform: 'uppercase' as const,
      color,
      border: `1px solid ${color}`,
      borderRadius: 3,
      padding: '1px 6px',
      flexShrink: 0,
    }}>
      {type}
    </span>
  );
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, isLast, onSelect, onCreateChild, selectedId }) => {
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedId === node.id;
  const brandData = typeof node.brand_data === 'string'
    ? (() => { try { return JSON.parse(node.brand_data); } catch { return {}; } })()
    : (node.brand_data || {});

  const primaryColor = brandData?.colors?.primary?.hex || '#f17022';

  return (
    <div style={{ position: 'relative' }}>
      {/* Connector lines */}
      {depth > 0 && (
        <>
          {/* Vertical stem from parent */}
          <div style={{
            position: 'absolute',
            left: -24,
            top: 0,
            bottom: isLast ? '50%' : 0,
            width: 1,
            background: 'var(--border)',
          }} />
          {/* Horizontal branch */}
          <div style={{
            position: 'absolute',
            left: -24,
            top: '50%',
            width: 20,
            height: 1,
            background: 'var(--border)',
            transform: 'translateY(-50%)',
          }} />
        </>
      )}

      {/* Node card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 10,
          border: `1px solid ${isSelected ? primaryColor + '60' : 'var(--border)'}`,
          background: isSelected ? primaryColor + '0a' : hovered ? 'var(--card-bg)' : 'var(--bg-secondary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
          zIndex: 1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(node)}
      >
        {/* Color swatch */}
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: primaryColor,
          flexShrink: 0,
          border: '1px solid var(--border)',
        }} />

        {/* Name + type */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 900,
            color: isSelected ? 'var(--text)' : 'var(--text)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {node.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <span style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--text-subtle)',
            }}>
              {node.brand_type || 'brand'}
            </span>
            {node.relationship_type && <RelBadge type={node.relationship_type} />}
          </div>
        </div>

        {/* Add child button */}
        <button
          onClick={(e) => { e.stopPropagation(); onCreateChild(node); }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: '1px solid rgba(241,112,34,0.3)',
            background: 'transparent',
            color: hovered ? '#f17022' : 'rgba(241,112,34,0.4)',
            fontSize: 16,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            fontWeight: 900,
          }}
          title="Add sub-brand"
        >
          +
        </button>
      </div>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div style={{
          marginLeft: 36,
          marginTop: 4,
          paddingLeft: 12,
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={idx === node.children.length - 1}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── CREATE SUB-BRAND DIALOG ──────────────────────────────────────────────────

interface CreateDialogProps {
  parent: ArchNode;
  onClose: () => void;
  onCreate: (parentId: number, data: CreateSubBrandForm) => Promise<void>;
}

const CreateDialog: React.FC<CreateDialogProps> = ({ parent, onClose, onCreate }) => {
  const [form, setForm] = useState<CreateSubBrandForm>({
    name: '',
    relationship_type: 'extension',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onCreate(parent.id, form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create sub-brand');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(12px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 420,
      }} onClick={e => e.stopPropagation()}>
        <p style={{
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: '0.6em',
          textTransform: 'uppercase',
          color: 'rgba(241,112,34,0.7)',
          marginBottom: 16,
        }}>
          Add sub-brand to {parent.name}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--text-subtle)', display: 'block', marginBottom: 8 }}>
              Brand Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Product Line X"
              autoFocus
              style={{
                width: '100%',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 16px',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--text-subtle)', display: 'block', marginBottom: 8 }}>
              Relationship Type
            </label>
            <select
              value={form.relationship_type}
              onChange={e => setForm(f => ({ ...f, relationship_type: e.target.value }))}
              style={{
                width: '100%',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 16px',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {RELATIONSHIP_TYPES.map(r => (
                <option key={r} value={r} style={{ background: 'var(--input-bg)' }}>{r}</option>
              ))}
            </select>
          </div>
          {error && (
            <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: 10,
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              style={{
                flex: 2,
                padding: '12px',
                border: 'none',
                borderRadius: 10,
                background: saving ? 'rgba(241,112,34,0.4)' : '#f17022',
                color: 'var(--text)',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: !form.name.trim() ? 0.4 : 1,
              }}
            >
              {saving ? 'Creating...' : 'Create Sub-Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── ARCHITECTURE VIEW ────────────────────────────────────────────────────────

interface ArchitectureViewProps {
  brand: BrandSystem;
  onSelectBrand?: (brandId: string | number) => void;
}

const ArchitectureView: React.FC<ArchitectureViewProps> = ({ brand, onSelectBrand }) => {
  const [tree, setTree] = useState<ArchNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(brand.id ? Number(brand.id) : null);
  const [createParent, setCreateParent] = useState<ArchNode | null>(null);

  const brandId = brand.id || brand.uid;

  const loadTree = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getBrandArchitecture(brandId as any);
      setTree(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load architecture');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const handleCreate = async (parentId: number, formData: CreateSubBrandForm) => {
    await api.createSubBrand(parentId, {
      name: formData.name,
      relationship_type: formData.relationship_type,
      brand_data: {},
    });
    await loadTree();
  };

  const handleSelect = (node: ArchNode) => {
    setSelectedId(node.id);
    if (onSelectBrand) {
      onSelectBrand(node.uid || node.id);
    }
  };

  const countNodes = (node: ArchNode): number => {
    return 1 + (node.children || []).reduce((acc, c) => acc + countNodes(c), 0);
  };

  const totalNodes = tree ? countNodes(tree) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: '0.8em',
          textTransform: 'uppercase',
          color: 'rgba(241,112,34,0.6)',
          marginBottom: 12,
        }}>
          Brand Architecture
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 4rem)',
          fontWeight: 900,
          fontFamily: 'Playfair Display, serif',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          margin: 0,
          marginBottom: 12,
        }}>
          {brand.name}
        </h1>
        {totalNodes > 1 && (
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--text-subtle)',
          }}>
            {totalNodes} brand{totalNodes !== 1 ? 's' : ''} in ecosystem
          </p>
        )}
      </div>

      {/* Kee */}
      <div style={{ marginBottom: 32, maxWidth: 520 }}>
        <KeeAlive animate={false}>
          This is how your brands connect. Add sub-brands, endorsed brands, or extensions — each one inherits the system you built.
        </KeeAlive>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-subtle)' }}>
          <div style={{
            width: 20,
            height: 20,
            border: '2px solid rgba(241,112,34,0.3)',
            borderTopColor: '#f17022',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            Loading hierarchy...
          </span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px 20px',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 10,
          color: '#f87171',
          fontSize: 13,
          marginBottom: 24,
        }}>
          {error}
          <button
            onClick={loadTree}
            style={{ marginLeft: 12, color: '#f17022', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, textDecoration: 'underline' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && tree && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, maxWidth: 960, alignItems: 'start' }}>
          {/* Tree panel */}
          <div>
            <div style={{
              padding: '4px 0',
              borderLeft: '2px solid rgba(241,112,34,0.2)',
              paddingLeft: 0,
            }}>
              <div style={{ paddingLeft: 0 }}>
                <TreeNode
                  node={tree}
                  depth={0}
                  isLast
                  onSelect={handleSelect}
                  onCreateChild={setCreateParent}
                  selectedId={selectedId}
                />
              </div>
            </div>

            {/* Legend */}
            <div style={{
              marginTop: 32,
              padding: '16px 20px',
              border: '1px solid var(--border)',
              borderRadius: 10,
              background: 'var(--bg-secondary)',
            }}>
              <p style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>
                Relationship Types
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {RELATIONSHIP_TYPES.map(r => (
                  <RelBadge key={r} type={r} />
                ))}
              </div>
            </div>
          </div>

          {/* Selected node detail */}
          {selectedId && (
            <SelectedNodeDetail
              tree={tree}
              selectedId={selectedId}
              onCreateChild={setCreateParent}
            />
          )}
        </div>
      )}

      {/* Empty state — no children */}
      {!loading && !error && tree && tree.children.length === 0 && (
        <div style={{ marginTop: 40, maxWidth: 400 }}>
          <div style={{
            padding: '32px',
            border: '1px dashed var(--border)',
            borderRadius: 16,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 32, marginBottom: 16 }}>🌱</p>
            <p style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--text-subtle)',
              marginBottom: 8,
            }}>
              No sub-brands yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>
              Grow your brand ecosystem by adding sub-brands, product lines, or extensions.
            </p>
            <button
              onClick={() => tree && setCreateParent(tree)}
              style={{
                padding: '10px 24px',
                border: '1px solid rgba(241,112,34,0.4)',
                borderRadius: 8,
                background: 'transparent',
                color: '#f17022',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              + Add First Sub-Brand
            </button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      {createParent && (
        <CreateDialog
          parent={createParent}
          onClose={() => setCreateParent(null)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

// ─── SELECTED NODE DETAIL PANEL ───────────────────────────────────────────────

const SelectedNodeDetail: React.FC<{
  tree: ArchNode;
  selectedId: number;
  onCreateChild: (node: ArchNode) => void;
}> = ({ tree, selectedId, onCreateChild }) => {
  const findNode = (node: ArchNode): ArchNode | null => {
    if (node.id === selectedId) return node;
    for (const child of node.children || []) {
      const found = findNode(child);
      if (found) return found;
    }
    return null;
  };

  const node = findNode(tree);
  if (!node) return null;

  const brandData = typeof node.brand_data === 'string'
    ? (() => { try { return JSON.parse(node.brand_data); } catch { return {}; } })()
    : (node.brand_data || {});

  const primaryColor = brandData?.colors?.primary?.hex || '#f17022';
  const secondaryColor = brandData?.colors?.secondary?.hex;
  const accentColor = brandData?.colors?.accent?.hex;
  const tagline = brandData?.voice?.tagline || brandData?.tagline;
  const archetype = brandData?.v3Strategy?.archetype || brandData?.foundation?.archetype;
  const headlineFont = brandData?.typography?.hierarchy?.headline?.fontFamily;

  return (
    <div style={{
      padding: 24,
      border: '1px solid var(--border)',
      borderRadius: 16,
      background: 'var(--bg-secondary)',
      position: 'sticky',
      top: 100,
    }}>
      {/* Color strip */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[primaryColor, secondaryColor, accentColor].filter(Boolean).map((c, i) => (
          <div key={i} style={{
            flex: i === 0 ? 3 : 1,
            height: 8,
            borderRadius: 4,
            background: c,
          }} />
        ))}
      </div>

      <h2 style={{
        fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
        fontWeight: 900,
        fontFamily: headlineFont ? `${headlineFont}, Playfair Display, serif` : 'Playfair Display, serif',
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
        color: primaryColor,
        marginBottom: 4,
        lineHeight: 1,
      }}>
        {node.name}
      </h2>

      {tagline && (
        <p style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          marginBottom: 16,
          fontFamily: 'Georgia, serif',
        }}>
          "{tagline}"
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <span style={{
          fontSize: 8, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase',
          color: 'var(--text-subtle)',
          border: '1px solid var(--border)',
          padding: '3px 10px', borderRadius: 4,
        }}>
          {node.brand_type || 'brand'}
        </span>
        {node.relationship_type && <RelBadge type={node.relationship_type} />}
        {archetype && (
          <span style={{
            fontSize: 8, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase',
            color: primaryColor + 'aa',
            border: `1px solid ${primaryColor}30`,
            padding: '3px 10px', borderRadius: 4,
          }}>
            {archetype}
          </span>
        )}
      </div>

      {node.children.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 8 }}>
            {node.children.length} sub-brand{node.children.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {node.children.map(child => {
              const childData = typeof child.brand_data === 'string'
                ? (() => { try { return JSON.parse(child.brand_data); } catch { return {}; } })()
                : (child.brand_data || {});
              const childColor = childData?.colors?.primary?.hex || '#333';
              return (
                <span key={child.id} style={{
                  fontSize: 9, fontWeight: 700, padding: '4px 10px',
                  borderRadius: 6, background: childColor + '22',
                  border: `1px solid ${childColor}44`,
                  color: childColor,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  {child.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => onCreateChild(node)}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid rgba(241,112,34,0.3)',
          borderRadius: 8,
          background: 'transparent',
          color: '#f17022',
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(241,112,34,0.08)';
          e.currentTarget.style.borderColor = 'rgba(241,112,34,0.6)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(241,112,34,0.3)';
        }}
      >
        + Add Sub-Brand to {node.name}
      </button>
    </div>
  );
};

export default ArchitectureView;
