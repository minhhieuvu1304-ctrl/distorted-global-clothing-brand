export const mockProducts = [
  {
    id: "gid://shopify/Product/1",
    title: "Distorted Tee — Black",
    handle: "distorted-tee-black",
    description: "Heavyweight cotton, oversized fit.",
    priceRange: { minVariantPrice: { amount: "45.00", currencyCode: "USD" } },
    images: { edges: [{ node: { url: "/placeholder.jpg", altText: "Black tee" } }] },
    variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/1", title: "M", availableForSale: true } }] },
  },
  {
    id: "gid://shopify/Product/2",
    title: "Distorted Hoodie — Cream",
    handle: "distorted-hoodie-cream",
    description: "Boxy fit, washed cotton fleece.",
    priceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } },
    images: { edges: [{ node: { url: "/placeholder.jpg", altText: "Cream hoodie" } }] },
    variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/2", title: "L", availableForSale: true } }] },
  },
];
