export async function uploadImageUriToCloudinary(uri: string) {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
    const folder = process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER || "seedsbiz/products";

    if (!cloudName || !uploadPreset) {
        throw new Error("Missing Cloudinary env (EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME / UPLOAD_PRESET)");
    }

    const form = new FormData();
    form.append("file", {
        uri,
        name: `product_${Date.now()}.jpg`,
        type: "image/jpeg",
    } as any);
    form.append("upload_preset", uploadPreset);
    form.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: form,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Upload Cloudinary failed");

    return String(data.secure_url);
}