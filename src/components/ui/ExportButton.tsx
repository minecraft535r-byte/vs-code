/**
 * ExportButton.tsx — Manual backup button.
 * 
 * Downloads a JSON file containing ALL of the current user's
 * localStorage data, timestamped for easy identification.
 */

import React from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  username: string;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ username, className }) => {
  const handleExport = () => {
    try {
      const data: Record<string, any> = {};
      const prefix = username ? `${username}_` : '';

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        // Include: user-scoped keys + global keys (appUsers, theme, etc.)
        if (key.startsWith(prefix) || key === 'appUsers' || key === 'theme_preference') {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || '""');
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }

      const exportObj = {
        _meta: {
          exportedAt: new Date().toISOString(),
          username,
          version: '1.0',
          totalKeys: Object.keys(data).length,
        },
        data,
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      a.href = url;
      a.download = `backup_${username || 'system'}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[export] Failed:', err);
    }
  };

  return (
    <button
      onClick={handleExport}
      className={className}
      title="تحميل نسخة احتياطية"
      aria-label="تحميل نسخة احتياطية"
    >
      <Download size={16} />
    </button>
  );
};

export default ExportButton;
