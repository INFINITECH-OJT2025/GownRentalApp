// utils/groupProducts.js

export const groupProductsByDetails = (products) => {
    const grouped = {};
  
    products.forEach((product) => {
      const key = `${product.name}-${product.price}-${product.category}-${product.image_url}`;
  
      if (!grouped[key]) {
        grouped[key] = {
          ...product,
          sizes: [],
          totalStock: 0,
          ids: [],
          groupedItems: [],
        };
      }
  
      grouped[key].sizes.push(product.size);
      grouped[key].totalStock += product.stock;
      grouped[key].ids.push(product.id);
      grouped[key].groupedItems.push(product);
    });
  
    return Object.values(grouped);
  };
  