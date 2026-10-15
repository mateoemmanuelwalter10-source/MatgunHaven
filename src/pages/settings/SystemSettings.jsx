import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchBusinessSettings,
  saveBusinessSettings,
} from "../../services/businessSettingsService";
import Loader from "../../components/common/Loader";

export default function SystemSettings() {
  const { businessSettings, setBusinessSettings } = useAuth();
  const [businessName, setBusinessName] = useState("Matgun Haven");
  const [businessTagline, setBusinessTagline] = useState("Purified Drinking Station");
  const [logoFile, setLogoFile] = useState(null);
  const [currentSettings, setCurrentSettings] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const { data, error: loadError } = await fetchBusinessSettings();
      if (!mounted) return;

      if (loadError) {
        setError(`Could not load business settings: ${loadError.message}`);
      } else {
        setCurrentSettings(data);
        setBusinessName(data.business_name || "");
        setBusinessTagline(data.business_tagline || "");
        setBusinessSettings(data);
      }
      setLoading(false);
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, [setBusinessSettings]);

  useEffect(() => {
    if (!logoFile) {
      setLocalPreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(logoFile);
    setLocalPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [logoFile]);

  const previewUrl =
    localPreviewUrl || currentSettings?.logo_url || businessSettings?.logo_url || "";

  useEffect(() => {
    if (!localPreviewUrl) return undefined;
    return () => URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const { data, error: saveError } = await saveBusinessSettings({
      businessName,
      businessTagline,
      logoFile,
      currentLogoPath: currentSettings?.logo_path,
    });

    if (saveError) {
      setError(`Could not save business settings: ${saveError.message}`);
    } else {
      setCurrentSettings(data);
      setBusinessName(data.business_name);
      setBusinessTagline(data.business_tagline);
      setBusinessSettings(data);
      setLogoFile(null);
      setMessage("Business settings saved.");
    }
    setSaving(false);
  }

  return (
    <section className="page-section form-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">System settings</p>
          <h1>Business branding</h1>
          <p>Update the business name, tagline, and logo shown across the app.</p>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        {loading ? (
          <Loader label="Loading business settings..." variant="block" />
        ) : (
          <>
            <div className="form-field">
              <label htmlFor="business-name">Business name</label>
              <input
                id="business-name"
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="business-tagline">Business tagline</label>
              <input
                id="business-tagline"
                type="text"
                value={businessTagline}
                onChange={(event) => setBusinessTagline(event.target.value)}
                maxLength={120}
                placeholder="Purified Drinking Station"
              />
            </div>

            <div className="form-field">
              <label htmlFor="business-logo">Business logo</label>
              <input
                id="business-logo"
                type="file"
                accept="image/*"
                onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
              />
            </div>

            {previewUrl && (
              <div className="business-logo-preview">
                <span>Logo preview</span>
                <img src={previewUrl} alt="Business logo preview" />
              </div>
            )}

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? <Loader label="Saving..." /> : "Save changes"}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
