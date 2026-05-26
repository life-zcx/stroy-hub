const matchesId = (left, right) => String(left) === String(right);

export function buildHierarchicalCategories(categories) {
  if (!categories || categories.length === 0) {
    return [];
  }

  const map = {};
  const roots = [];

  categories.forEach((category) => {
    map[category.id] = { ...category, children: [] };
  });

  categories.forEach((category) => {
    if (category.parentId && map[category.parentId]) {
      map[category.parentId].children.push(map[category.id]);
      return;
    }

    roots.push(map[category.id]);
  });

  const result = [];

  const walkTree = (node, depth = 0) => {
    result.push({ ...node, depth });
    node.children.sort((left, right) => left.name.localeCompare(right.name));
    node.children.forEach((child) => walkTree(child, depth + 1));
  };

  roots.sort((left, right) => left.name.localeCompare(right.name));
  roots.forEach((root) => walkTree(root, 0));

  return result;
}

export function getCategoryPath(categories, categoryId) {
  if (!categoryId) {
    return '';
  }

  const breadcrumbs = [];
  let current = categories.find((category) => matchesId(category.id, categoryId));

  while (current) {
    breadcrumbs.unshift(current.name);
    current = current.parentId
      ? categories.find((category) => matchesId(category.id, current.parentId))
      : null;
  }

  return breadcrumbs.join(' / ');
}

export function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getOrderStatusText(status) {
  switch (status) {
    case 'pending':
      return 'В обработке';
    case 'processing':
      return 'Сборка заказа';
    case 'shipped':
      return 'В доставке';
    case 'completed':
      return 'Выполнен';
    case 'cancelled':
      return 'Отменен';
    default:
      return status;
  }
}

export function getOrderStatusClass(status) {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getCallbackStatusClass(status) {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getCallbackStatusText(status) {
  switch (status) {
    case 'pending':
      return 'Ожидает обзвона';
    case 'completed':
      return 'Выполнено';
    case 'rejected':
      return 'Отказ / Недозвон';
    default:
      return status;
  }
}

export function getPartnerRequestStatusClass(status) {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'contacted':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getPartnerRequestStatusText(status) {
  switch (status) {
    case 'pending':
      return 'Новая заявка';
    case 'contacted':
      return 'Связались';
    case 'approved':
      return 'Одобрено';
    case 'rejected':
      return 'Отклонено';
    default:
      return status;
  }
}
