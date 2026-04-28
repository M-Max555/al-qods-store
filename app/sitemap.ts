export default function sitemap() {
    return [
        {
            url: "https://al-qods-store.vercel.app/",
            priority: 1,
        },
        {
            url: "https://al-qods-store.vercel.app/products",
            priority: 0.9,
        },
        {
            url: "https://al-qods-store.vercel.app/cart",
            priority: 0.8,
        },
    ];
}