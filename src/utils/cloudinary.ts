export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "alqods_products_upload");

  const res = await fetch("https://api.cloudinary.com/v1_1/dol0m9lbj/image/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error("Cloudinary Error:", errorData);
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}
