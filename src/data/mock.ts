export type Column = {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
};

export type Table = {
  id: string;
  name: string;
  columns: Column[];
};

export const mockSchema: Table[] = [
  {
    id: "users",
    name: "users",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "email", type: "varchar(255)" },
      { name: "first_name", type: "varchar(100)" },
      { name: "last_name", type: "varchar(100)" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    id: "products",
    name: "products",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "name", type: "varchar(255)" },
      { name: "description", type: "text" },
      { name: "price", type: "numeric(10,2)" },
      { name: "category_id", type: "uuid", isForeign: true, references: "categories.id" },
      { name: "stock_quantity", type: "integer" },
    ],
  },
  {
    id: "categories",
    name: "categories",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "name", type: "varchar(100)" },
      { name: "parent_id", type: "uuid", isForeign: true, references: "categories.id" },
    ],
  },
  {
    id: "orders",
    name: "orders",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "user_id", type: "uuid", isForeign: true, references: "users.id" },
      { name: "status", type: "varchar(50)" },
      { name: "total_amount", type: "numeric(10,2)" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    id: "order_items",
    name: "order_items",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "order_id", type: "uuid", isForeign: true, references: "orders.id" },
      { name: "product_id", type: "uuid", isForeign: true, references: "products.id" },
      { name: "quantity", type: "integer" },
      { name: "unit_price", type: "numeric(10,2)" },
    ],
  },
  {
    id: "payments",
    name: "payments",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "order_id", type: "uuid", isForeign: true, references: "orders.id" },
      { name: "amount", type: "numeric(10,2)" },
      { name: "payment_method", type: "varchar(50)" },
      { name: "status", type: "varchar(50)" },
      { name: "processed_at", type: "timestamp" },
    ],
  },
  {
    id: "inventory",
    name: "inventory",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "product_id", type: "uuid", isForeign: true, references: "products.id" },
      { name: "warehouse_id", type: "uuid" },
      { name: "quantity_on_hand", type: "integer" },
      { name: "last_updated", type: "timestamp" },
    ],
  },
];

export type SavedQuery = {
  id: string;
  name: string;
  sql: string;
  category: "Recent" | "Favorites" | "Team Queries";
};

export const mockSavedQueries: SavedQuery[] = [
  {
    id: "q1",
    name: "Total Sales by Month",
    category: "Favorites",
    sql: `SELECT 
  DATE_TRUNC('month', created_at) AS month,
  SUM(total_amount) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY 1
ORDER BY 1 DESC;`,
  },
  {
    id: "q2",
    name: "Top Selling Products",
    category: "Team Queries",
    sql: `SELECT 
  p.name,
  SUM(oi.quantity) as total_sold,
  SUM(oi.quantity * oi.unit_price) as total_revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;`,
  },
  {
    id: "q3",
    name: "Users with Highest Order Count",
    category: "Favorites",
    sql: `SELECT 
  u.first_name,
  u.last_name,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as lifetime_value
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY order_count DESC
LIMIT 50;`,
  },
  {
    id: "q4",
    name: "Unpaid Orders",
    category: "Recent",
    sql: `SELECT 
  o.id as order_id,
  u.email,
  o.total_amount,
  o.created_at
FROM orders o
JOIN users u ON u.id = o.user_id
LEFT JOIN payments p ON p.order_id = o.id
WHERE p.id IS NULL OR p.status != 'success'
ORDER BY o.created_at ASC;`,
  },
  {
    id: "q5",
    name: "Category-wise Revenue",
    category: "Team Queries",
    sql: `SELECT 
  c.name as category_name,
  SUM(oi.quantity * oi.unit_price) as revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY revenue DESC;`,
  },
];

export const mockQueryResults: Record<string, any[]> = {
  "Total Sales by Month": [
    { month: "2023-10-01", revenue: 145000.50 },
    { month: "2023-09-01", revenue: 132000.00 },
    { month: "2023-08-01", revenue: 128500.25 },
    { month: "2023-07-01", revenue: 115000.00 },
    { month: "2023-06-01", revenue: 108000.75 },
    { month: "2023-05-01", revenue: 95000.00 },
  ],
  "Top Selling Products": [
    { name: "Wireless Noise-Cancelling Headphones", total_sold: 1245, total_revenue: 372255.00 },
    { name: "Ergonomic Office Chair", total_sold: 980, total_revenue: 244020.00 },
    { name: "Mechanical Keyboard", total_sold: 850, total_revenue: 110500.00 },
    { name: "4K Monitor 27-inch", total_sold: 620, total_revenue: 216380.00 },
    { name: "USB-C Hub", total_sold: 1500, total_revenue: 74850.00 },
  ],
  "Users with Highest Order Count": [
    { first_name: "Alice", last_name: "Smith", order_count: 42, lifetime_value: 12500.50 },
    { first_name: "Bob", last_name: "Johnson", order_count: 38, lifetime_value: 9800.00 },
    { first_name: "Charlie", last_name: "Brown", order_count: 35, lifetime_value: 15200.75 },
    { first_name: "Diana", last_name: "Prince", order_count: 31, lifetime_value: 8400.25 },
    { first_name: "Evan", last_name: "Wright", order_count: 29, lifetime_value: 6100.00 },
  ],
  "Unpaid Orders": [
    { order_id: "ord-8832", email: "user1@example.com", total_amount: 150.00, created_at: "2023-10-25T14:30:00Z" },
    { order_id: "ord-8845", email: "user2@example.com", total_amount: 89.99, created_at: "2023-10-26T09:15:00Z" },
    { order_id: "ord-8890", email: "user3@example.com", total_amount: 1200.50, created_at: "2023-10-27T11:45:00Z" },
  ],
  "Category-wise Revenue": [
    { category_name: "Electronics", revenue: 850000.00 },
    { category_name: "Furniture", revenue: 420000.00 },
    { category_name: "Accessories", revenue: 185000.00 },
    { category_name: "Clothing", revenue: 120000.00 },
    { category_name: "Books", revenue: 45000.00 },
  ]
};

export const getMockResultForQuery = (sql: string) => {
  const normalizedSql = sql.toLowerCase();
  if (normalizedSql.includes("month") && normalizedSql.includes("revenue")) {
    return { data: mockQueryResults["Total Sales by Month"], queryName: "Total Sales by Month" };
  }
  if (normalizedSql.includes("top selling") || normalizedSql.includes("total_sold")) {
    return { data: mockQueryResults["Top Selling Products"], queryName: "Top Selling Products" };
  }
  if (normalizedSql.includes("order_count")) {
    return { data: mockQueryResults["Users with Highest Order Count"], queryName: "Users with Highest Order Count" };
  }
  if (normalizedSql.includes("unpaid") || normalizedSql.includes("p.id is null")) {
    return { data: mockQueryResults["Unpaid Orders"], queryName: "Unpaid Orders" };
  }
  if (normalizedSql.includes("category_name")) {
    return { data: mockQueryResults["Category-wise Revenue"], queryName: "Category-wise Revenue" };
  }
  
  // Default mock response
  return {
    data: [
      { id: 1, name: "Sample Data 1", value: 100 },
      { id: 2, name: "Sample Data 2", value: 200 },
      { id: 3, name: "Sample Data 3", value: 300 },
    ],
    queryName: "Custom Query"
  };
};

export const mockExplainPlan = {
  name: "Aggregate",
  details: "GroupAggregate",
  cost: "145.20..147.30",
  rows: 200,
  children: [
    {
      name: "Sort",
      details: "Sort Key: date_trunc('month', created_at)",
      cost: "145.20..145.70",
      rows: 200,
      children: [
        {
          name: "Seq Scan",
          details: "Filter: (status = 'completed')",
          cost: "0.00..137.55",
          rows: 200,
          children: []
        }
      ]
    }
  ]
};
