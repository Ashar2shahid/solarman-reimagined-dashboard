import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Save, RotateCcw, Thermometer, Battery, Clock, Zap, Plus, Trash2 } from 'lucide-react';

interface SocLevel {
  level: number;
  severity: 'info' | 'warning' | 'critical';
}

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [socLevels, setSocLevels] = useState<SocLevel[]>([]);
  const [originalSocLevels, setOriginalSocLevels] = useState<SocLevel[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings.get().then(s => {
      setSettings(s);
      setOriginal(s);
      try {
        const levels = JSON.parse(s.battery_soc_levels || '[]');
        setSocLevels(levels);
        setOriginalSocLevels(levels);
      } catch { /* ignore */ }
    });
  }, []);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original)
    || JSON.stringify(socLevels) !== JSON.stringify(originalSocLevels);

  const handleSave = async () => {
    setSaving(true);
    const toSave = { ...settings, battery_soc_levels: JSON.stringify(socLevels) };
    const res = await api.settings.update(toSave);
    setSettings(res.settings);
    setOriginal(res.settings);
    try {
      const levels = JSON.parse(res.settings.battery_soc_levels || '[]');
      setSocLevels(levels);
      setOriginalSocLevels(levels);
    } catch { /* ignore */ }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings({ ...original });
    setSocLevels([...originalSocLevels]);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addSocLevel = () => {
    setSocLevels(prev => [...prev, { level: 50, severity: 'info' as const }].sort((a, b) => a.level - b.level));
  };

  const removeSocLevel = (index: number) => {
    setSocLevels(prev => prev.filter((_, i) => i !== index));
  };

  const updateSocLevel = (index: number, field: 'level' | 'severity', value: string | number) => {
    setSocLevels(prev => {
      const updated = [...prev];
      if (field === 'level') updated[index] = { ...updated[index], level: Number(value) };
      else updated[index] = { ...updated[index], severity: value as SocLevel['severity'] };
      return updated;
    });
  };

  const gridOutageEnabled = settings.grid_outage_enabled === 'true';
  const suppressAcCooling = settings.suppress_temp_if_ac_cooling === 'true';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-text">Alert Settings</h2>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-surface-warm text-text-muted hover:bg-border transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1 px-4 py-1.5 text-xs rounded-lg bg-text text-surface font-medium disabled:opacity-30 transition-colors"
          >
            <Save className="w-3 h-3" /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Inverter Temperature */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-text">Inverter Temperature</h3>
          </div>
          <div className="space-y-3">
            <SettingRow label="Warning" desc="Start monitoring" value={settings.inverter_temp_warning} unit="°C" onChange={v => updateSetting('inverter_temp_warning', v)} />
            <SettingRow label="Recommend AC" desc="Suggest turning on AC" value={settings.inverter_temp_recommend_ac} unit="°C" onChange={v => updateSetting('inverter_temp_recommend_ac', v)} />
            <SettingRow label="Critical" desc="Immediate attention" value={settings.inverter_temp_critical} unit="°C" onChange={v => updateSetting('inverter_temp_critical', v)} />
          </div>
        </div>

        {/* Battery Temperature */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-text">Battery Temperature</h3>
          </div>
          <div className="space-y-3">
            <SettingRow label="Warning" desc="Start monitoring" value={settings.battery_temp_warning} unit="°C" onChange={v => updateSetting('battery_temp_warning', v)} />
            <SettingRow label="Recommend AC" desc="Suggest turning on AC" value={settings.battery_temp_recommend_ac} unit="°C" onChange={v => updateSetting('battery_temp_recommend_ac', v)} />
            <SettingRow label="Critical" desc="Immediate attention" value={settings.battery_temp_critical} unit="°C" onChange={v => updateSetting('battery_temp_critical', v)} />
          </div>
        </div>

        {/* Battery SoC Levels */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold text-text">Battery SoC Alerts</h3>
            </div>
            <button
              onClick={addSocLevel}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg bg-surface-warm text-text-muted hover:bg-border transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Level
            </button>
          </div>
          {socLevels.length === 0 ? (
            <div className="text-sm text-text-muted text-center py-3">No SoC alerts configured</div>
          ) : (
            <div className="space-y-2">
              {socLevels.map((sl, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-text-muted">Below</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={sl.level}
                      onChange={e => updateSocLevel(i, 'level', e.target.value)}
                      className="w-14 px-2 py-1 text-sm text-right rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-text-muted">%</span>
                  </div>
                  <select
                    value={sl.severity}
                    onChange={e => updateSocLevel(i, 'severity', e.target.value)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg border-0 ${SEVERITY_COLORS[sl.severity]}`}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button
                    onClick={() => removeSocLevel(i)}
                    className="p-1 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grid Outage */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-text">Grid Outage Alert</h3>
                <p className="text-[11px] text-text-muted">Notify when grid connection is lost</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('grid_outage_enabled', gridOutageEnabled ? 'false' : 'true')}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                gridOutageEnabled ? 'bg-green-500' : 'bg-stone-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                gridOutageEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* AC Suppression */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-text">Suppress Alerts When AC Cooling</h3>
                <p className="text-[11px] text-text-muted">Skip temperature alerts if AC is on and temp is decreasing</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('suppress_temp_if_ac_cooling', suppressAcCooling ? 'false' : 'true')}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                suppressAcCooling ? 'bg-green-500' : 'bg-stone-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                suppressAcCooling ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>
          {suppressAcCooling && (
            <SettingRow label="Check Window" desc="Minutes to check if temp has decreased" value={settings.suppress_temp_check_minutes} unit="min" onChange={v => updateSetting('suppress_temp_check_minutes', v)} />
          )}
        </div>

        {/* Cooldown */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text">General</h3>
          </div>
          <SettingRow label="Alert Cooldown" desc="Minutes between repeat alerts of the same type" value={settings.alert_cooldown_minutes} unit="min" onChange={v => updateSetting('alert_cooldown_minutes', v)} />
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, value, unit, onChange }: {
  label: string;
  desc: string;
  value: string | undefined;
  unit: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-text">{label}</div>
        <div className="text-[11px] text-text-muted">{desc}</div>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="w-16 px-2 py-1 text-sm text-right rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-xs text-text-muted w-6">{unit}</span>
      </div>
    </div>
  );
}
