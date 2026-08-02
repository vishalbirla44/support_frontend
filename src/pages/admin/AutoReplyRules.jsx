import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Clock,
  Hash,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import api from '../../api/axios';
import AdminSidebar from '../../components/AdminSidebar';

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    type: 'welcome',
    label: 'Welcome Message',
    icon: MessageSquare,
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    description: 'Sent automatically when a customer messages for the very first time.',
  },
  {
    type: 'keyword',
    label: 'Keyword Triggers',
    icon: Hash,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    description: 'Fires when an incoming message contains a specific word or phrase.',
  },
  {
    type: 'after_hours',
    label: 'After Hours Message',
    icon: Clock,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    description: 'Sent when a message arrives outside your configured business hours.',
  },
];

// ─── RuleModal ────────────────────────────────────────────────────────────────

const RuleModal = ({ isOpen, onClose, onSave, editRule, sectionType }) => {
  const [form, setForm] = useState({name: '', type: sectionType, trigger: '', responseText: '', mediaUrl: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editRule) {
      setForm({
        name: editRule.name || '',
        type: editRule.type,
        trigger: editRule.trigger || '',
        responseText: editRule.responseText || '',
        mediaUrl: editRule.mediaUrl || '',
      });
    } else {
      setForm({ name: '', type: sectionType, trigger: '', responseText: '', mediaUrl: '' });
    }
    setError('');
  }, [editRule, sectionType, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
     if (!form.name.trim()) {
  setError('Rule name is required.');
  return;
    if (!form.responseText.trim()) {
      setError('Response text is required.');
      return;
    }
    if (form.type === 'keyword' && !form.trigger.trim()) {
      setError('Keyword trigger is required for keyword rules.');
      return;
    }
   
}
    setSaving(true);
    setError('');
    try {
      console.log(form);
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save rule.');
    } finally {
      setSaving(false);
    }
  };

  const section = SECTIONS.find((s) => s.type === form.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {editRule ? 'Edit Rule' : 'Add Rule'} —{' '}
            <span className={`${section?.color}`}>{section?.label}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Keyword trigger — only for keyword type */}
          {form.type === 'keyword' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keyword / Phrase <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                placeholder="e.g. price, help, refund"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
              />
              <p className="text-xs text-gray-400 mt-1">
                Case-insensitive. Fires on first matching keyword per message.
              </p>
            </div>
          )}

          {/* Rule Name */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Rule Name <span className="text-red-500">*</span>
  </label>

  <input
    type="text"
    value={form.name}
    onChange={(e) =>
      setForm({
        ...form,
        name: e.target.value,
      })
    }
    placeholder="Example: Welcome Message"
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
  />
</div>

          {/* Response Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.responseText}
              onChange={(e) => setForm({ ...form, responseText: e.target.value })}
              rows={4}
              placeholder="Type the message to send automatically..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] resize-none"
            />
          </div>

          {/* Media URL (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Media URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={form.mediaUrl}
              onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[#25D366] text-white font-medium hover:bg-[#1ebe59] disabled:opacity-60 transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── RuleCard ─────────────────────────────────────────────────────────────────

const RuleCard = ({ rule, section, onEdit, onDelete, onToggle }) => {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(rule);
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this rule? This cannot be undone.')) return;
    setDeleting(true);
    await onDelete(rule._id);
    setDeleting(false);
  };

  return (
    <div
      className={`relative bg-white border rounded-xl p-4 transition-all ${
        rule.active ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-60'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${section.badge}`}>
            {section.label}
          </span>
          {rule.type === 'keyword' && rule.trigger && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
              "{rule.trigger}"
            </span>
          )}
          {!rule.active && (
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
              Inactive
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Toggle active */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={rule.active ? 'Deactivate' : 'Activate'}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
          >
            {toggling ? (
              <Loader2 size={16} className="animate-spin" />
            ) : rule.active ? (
              <ToggleRight size={18} className="text-[#25D366]" />
            ) : (
              <ToggleLeft size={18} />
            )}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(rule)}
            title="Edit rule"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-blue-500"
          >
            <Pencil size={15} />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete rule"
            className="p-1.5 rounded-lg hover:bg-red-50 transition text-gray-400 hover:text-red-500"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      </div>

      {/* Response preview */}
      <p className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-3 whitespace-pre-wrap">
        {rule.responseText}
      </p>

      {/* Media URL */}
      {rule.mediaUrl && (
        <p className="mt-2 text-xs text-gray-400 truncate">
          📎 {rule.mediaUrl}
        </p>
      )}
    </div>
  );
};

// ─── Section Panel ────────────────────────────────────────────────────────────

const SectionPanel = ({ section, rules, onAdd, onEdit, onDelete, onToggle }) => {
  const Icon = section.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className={`flex items-center justify-between px-5 py-4 ${section.bg} border-b ${section.border}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm ${section.color}`}>
            <Icon size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{section.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
          </div>
        </div>
        <button
          onClick={() => onAdd(section.type)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-sm font-medium text-gray-700 border border-gray-200 hover:border-[#25D366] hover:text-[#25D366] shadow-sm transition"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Rules list */}
      <div className="p-4 space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Icon size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No {section.label.toLowerCase()} rules yet.</p>
            <button
              onClick={() => onAdd(section.type)}
              className="mt-2 text-xs text-[#25D366] hover:underline"
            >
              Add your first rule
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <RuleCard
              key={rule._id}
              rule={rule}
              section={section}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AutoReplyRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [activeSectionType, setActiveSectionType] = useState('welcome');

  // ── Fetch all rules ──────────────────────────────────────────────────────
  const fetchRules = async () => {
  setLoading(true);
  setError('');

  try {
    const { data } = await api.get('/admin/autoreplies');

   
    console.log("AUTO REPLY RESPONSE:", data);
 setRules(data.rules || []);

  } catch (err) {
    console.error(err);
    setError('Failed to load rules. Please refresh.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchRules();
  }, []);

  // ── Open modal ──────────────────────────────────────────────────────────
    const handleAdd = (type) => {
      setEditRule(null);
      setActiveSectionType(type);
      setModalOpen(true);
    };

  const handleEdit = (rule) => {
    setEditRule(rule);
    setActiveSectionType(rule.type);
    setModalOpen(true);
  };

  // ── Save (create or update) ─────────────────────────────────────────────
 const handleSave = async (form) => {
   console.log("FORM BEFORE SAVE:");
  console.log(form);

  try {
    if (editRule) {
      const { data } = await api.put(
        `/admin/autoreplies/${editRule._id}`,
        form
      );

      setRules((prev) =>
        prev.map((r) => (r._id === editRule._id ? data : r))
      );
    } else {
      const { data } = await api.post(
        '/admin/autoreplies',
        form
      );

      setRules((prev) => [...prev, data]);
    }
  } catch (err) {
    console.log("========== SAVE ERROR ==========");
    console.log("Status:", err.response?.status);
console.log(JSON.stringify(err.response?.data, null, 2));
    console.log("Request Body:", form);
    console.log(err);
  }
};

  // ── Toggle active ───────────────────────────────────────────────────────
  const handleToggle = async (rule) => {
    try {
      const { data } = await api.put(`/admin/autoreplies/${rule._id}`, {
        active: !rule.active,
      });
      setRules((prev) => prev.map((r) => (r._id === rule._id ? data : r)));
    } catch {
      // silent fail — UI stays in sync on next fetch
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/autoreplies/${id}`);
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch {
      alert('Failed to delete rule. Please try again.');
    }
  };

  // ── Group rules by type ─────────────────────────────────────────────────
  const rulesByType = (type) => rules.filter((r) => r.type === type);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-chat-gray">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">


      
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Auto-Reply Rules</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage automated responses sent to customers based on timing and keywords.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          {error}
          <button onClick={fetchRules} className="ml-auto underline text-red-500 hover:text-red-700">
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5">
          {SECTIONS.map((section) => (
            <SectionPanel
              key={section.type}
              section={section}
              rules={rulesByType(section.type)}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Rule Modal */}
      <RuleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editRule={editRule}
        sectionType={activeSectionType}
      />
      </div>
    </div>
  );
};

export default AutoReplyRules;