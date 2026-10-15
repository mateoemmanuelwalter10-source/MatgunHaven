import { supabase } from "./supabase";
import { logSystemError, logSystemEvent } from "./systemLogService";

const settingsTable = "business_settings";
const logoBucket = "system_business_data";

function getLogoUrl(logoPath) {
  if (!logoPath) return "";

  const { data } = supabase.storage.from(logoBucket).getPublicUrl(logoPath);
  return data.publicUrl;
}

export async function fetchBusinessSettings() {
  const { data, error } = await supabase
    .from(settingsTable)
    .select("business_name, business_tagline:subtitle, logo_path")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    await logSystemError("fetch_business_settings", error, {
      entityType: "business_settings",
    });
    return { data: null, error };
  }

  return {
    data: data
      ? { ...data, logo_url: getLogoUrl(data.logo_path) }
      : {
          business_name: "Matgun Haven",
          business_tagline: "Purified Drinking Station",
          logo_path: null,
          logo_url: "",
        },
    error: null,
  };
}

export async function saveBusinessSettings({
  businessName,
  businessTagline,
  logoFile,
  currentLogoPath,
}) {
  let logoPath = currentLogoPath || null;
  let uploadedPath = null;

  if (logoFile) {
    if (!logoFile.type.startsWith("image/")) {
      const error = new Error("Choose a valid image file for the logo.");
      await logSystemError("save_business_settings", error, {
        entityType: "business_settings",
      });
      return { data: null, error };
    }

    const extension = logoFile.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "img";
    uploadedPath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(logoBucket)
      .upload(uploadedPath, logoFile, {
        contentType: logoFile.type,
        upsert: false,
      });

    if (uploadError) {
      await logSystemError("upload_business_logo", uploadError, {
        entityType: "business_settings",
      });
      return { data: null, error: uploadError };
    }
    logoPath = uploadedPath;
  }

  const { data, error } = await supabase
    .from(settingsTable)
    .upsert(
      {
        id: true,
        business_name: businessName.trim(),
        subtitle: businessTagline.trim(),
        logo_path: logoPath,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("business_name, business_tagline:subtitle, logo_path")
    .single();

  if (error) {
    await logSystemError("save_business_settings", error, {
      entityType: "business_settings",
    });
    if (uploadedPath) {
      const { error: cleanupError } = await supabase.storage
        .from(logoBucket)
        .remove([uploadedPath]);
      if (cleanupError) {
        await logSystemError("cleanup_failed_business_logo", cleanupError, {
          entityType: "business_settings",
        });
        return {
          data: null,
          error: new Error(`${error.message} Logo cleanup failed: ${cleanupError.message}`),
        };
      }
    }
    return { data: null, error };
  }

  await logSystemEvent({
    eventType: "update",
    message: "Business settings updated",
    entityType: "business_settings",
  });

  return {
    data: { ...data, logo_url: getLogoUrl(data.logo_path) },
    error: null,
  };
}
