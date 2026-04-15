"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Props = {
  profileId: string;
  canEdit: boolean;
};

export default function PhotoGallery({ profileId, canEdit }: Props) {
  const { appUser } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("profile_photos")
      .select("*").eq("profile_id", profileId).order("sort_order").order("created_at");
    const pics = data || [];
    setPhotos(pics);

    const urls: Record<string, string> = {};
    await Promise.all(pics.map(async (p: any) => {
      const { data: signed } = await supabase.storage.from("photos").createSignedUrl(p.photo_path, 3600);
      if (signed?.signedUrl) urls[p.id] = signed.signedUrl;
    }));
    setSignedUrls(urls);
  }

  useEffect(() => { load(); }, [profileId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !appUser) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) continue;
      const ext = file.name.split(".").pop();
      const path = `${appUser.id}/${profileId}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from("photos").upload(path, file);
      if (!error) {
        await supabase.from("profile_photos").insert({
          profile_id: profileId, photo_path: path, uploaded_by: appUser.id,
          sort_order: photos.length + i, is_primary: photos.length === 0 && i === 0,
        });
      }
    }
    e.target.value = "";
    setUploading(false);
    load();
  }

  async function deletePhoto(photoId: string, path: string) {
    if (!confirm("Delete this photo?")) return;
    await supabase.storage.from("photos").remove([path]);
    await supabase.from("profile_photos").delete().eq("id", photoId);
    load();
  }

  async function setPrimary(photoId: string) {
    await supabase.from("profile_photos").update({ is_primary: false }).eq("profile_id", profileId);
    await supabase.from("profile_photos").update({ is_primary: true }).eq("id", photoId);
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Photos ({photos.length})
        </h3>
        {canEdit && (
          <label className="text-sm text-[#C4956A] hover:underline cursor-pointer">
            + Add Photos
            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
          </label>
        )}
      </div>

      {uploading && <p className="text-sm text-[#C4956A] mb-2 animate-pulse">Uploading...</p>}

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-sm mb-2">No photos yet</p>
          {canEdit && (
            <label className="text-sm text-[#C4956A] hover:underline cursor-pointer">
              Upload photos
              <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </label>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative group">
              <img
                src={signedUrls[p.id] || ""}
                alt=""
                className={`w-full aspect-square rounded-lg object-cover cursor-pointer border-2 transition-all ${p.is_primary ? "border-[#C4956A]" : "border-transparent hover:border-gray-300"}`}
                onClick={() => setViewing(signedUrls[p.id] || null)}
              />
              {p.is_primary && (
                <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 bg-[#C4956A] text-white rounded-full">Primary</span>
              )}
              {canEdit && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!p.is_primary && (
                    <button onClick={() => setPrimary(p.id)} className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50">★ Primary</button>
                  )}
                  <button onClick={() => deletePhoto(p.id, p.photo_path)} className="text-[9px] px-1.5 py-0.5 bg-white border border-red-300 rounded text-red-500 hover:bg-red-50">✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onClick={() => setViewing(null)}>
          <img src={viewing} alt="" className="max-w-full max-h-full rounded-lg object-contain" />
          <button onClick={() => setViewing(null)} className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">✕</button>
        </div>
      )}
    </div>
  );
}