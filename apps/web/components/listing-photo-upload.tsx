"use client";

import { useState, type ChangeEvent } from "react";
import { browserSupabase } from "@/lib/supabase/browser";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 5;
const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

export function ListingPhotoUpload({ listingId, count }: {
  listingId: string;
  count: number;
}) {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  async function onSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || working) return;
    if (count >= MAX_PHOTOS) {
      setMessage("This listing already has the maximum number of photos.");
      return;
    }
    const extension = MIME_EXTENSION[file.type];
    if (!extension || file.size < 1 || file.size > MAX_FILE_BYTES) {
      setMessage("Use a JPEG, PNG or WebP image smaller than 5 MB.");
      return;
    }
    const client = browserSupabase();
    if (!client) {
      setMessage("Image upload is unavailable right now.");
      return;
    }
    setWorking(true);
    setMessage("Uploading your image…");
    try {
      const { data: existing, error: findError } = await client.from("listing_photos")
        .select("position").eq("listing_id", listingId);
      if (findError) {
        setMessage("Could not check image slots. Please retry.");
        return;
      }
      const used = new Set((existing ?? []).map(photo => Number(photo.position)));
      const next = Array.from({ length: MAX_PHOTOS }, (_, i) => i + 1)
        .find(slot => !used.has(slot));
      if (!next) {
        setMessage("This listing already has five photos.");
        return;
      }
      const path = listingId + "/" + crypto.randomUUID() + "." + extension;
      const { error: uploadError } = await client.storage.from("listing-media").upload(path, file, {
        contentType: file.type, upsert: false, cacheControl: "3600",
      });
      if (uploadError) {
        setMessage("Image upload failed. Check the file and retry.");
        return;
      }
      const { error: registrationError } = await client.from("listing_photos").insert({
        listing_id: listingId,
        storage_path: path,
        position: next,
      });
      if (registrationError) {
        // Only orphan objects may be removed by their original uploader.
        await client.storage.from("listing-media").remove([path]);
        setMessage("Image could not be attached. Please retry.");
        return;
      }
      setMessage("Image uploaded and saved.");
      window.location.reload();
    } catch {
      setMessage("Image upload failed. Please try again.");
    } finally {
      setWorking(false);
    }
  }
  return <div className="photo-upload">
    <label htmlFor="listing-photo">Add a listing photo ({count}/{MAX_PHOTOS})</label>
    <input
      id="listing-photo" type="file" accept="image/jpeg,image/png,image/webp"
      onChange={onSelect} disabled={working || count >= MAX_PHOTOS}
    />
    <p className="photo-help">JPEG, PNG or WebP · Max 5 MB · Max 5 photos. Do not upload sensitive information.</p>
    <p role="status" aria-live="polite">{message}</p>
  </div>;
}
