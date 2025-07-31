const { Category } = require('./models');

(async () => {
  try {
    const categories = await Category.findAll();
    console.log('当前分类列表:');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id}, 名称: ${cat.name}, 描述: ${cat.description}`);
    });
  } catch (error) {
    console.error('查询失败:', error);
  }
  process.exit(0);
})();
