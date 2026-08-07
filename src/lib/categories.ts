export const DEFAULT_PRODUCT_CATEGORIES = [
  'Dresses',
  'Sleepwear',
  'Baby and maternity',
  'Heels and shoes',
  'Accessories',
  'Kids wear',
  'Bags and phone covers',
  'Home appliances',
  'Customization',
];

export const getProductCategoryOptions = (categories: string[]) => {
  const extras = Array.from(
    new Set(categories.filter((category) => category && !DEFAULT_PRODUCT_CATEGORIES.includes(category)))
  );

  return [...DEFAULT_PRODUCT_CATEGORIES, ...extras];
};
