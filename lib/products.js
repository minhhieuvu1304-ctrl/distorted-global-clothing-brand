import { shopifyFetch } from "./shopify";
import { mockProducts } from "./mockProducts";

const PRODUCTS_QUERY = `
  query Products {
    products(first: 50) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 1) { edges { node { url altText } } }
          variants(first: 10) { edges { node { id title availableForSale } } }
        }
      }
    }
  }
`;

export async function getProducts() {
  const data = await shopifyFetch(PRODUCTS_QUERY);
  if (!data) return mockProducts; // fallback when no token
  return data.products.edges.map((e) => e.node);
}
