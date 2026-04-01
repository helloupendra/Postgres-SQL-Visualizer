import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// A simple validation endpoint to verify the connection
app.get("/api/status", async (req, res) => {
  try {
    const result = await pool.query("SELECT 1 AS status");
    res.json({ connected: true, check: result.rows[0]?.status });
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.post("/api/query", async (req, res) => {
  const { sql } = req.body;
  if (!sql) {
    return res.status(400).json({ error: "Missing 'sql' in request body" });
  }

  try {
    const result = await pool.query(sql);
    res.json({
      data: result.rows,
      rowCount: result.rowCount,
      command: result.command,
      fields: result.fields.map(f => ({ name: f.name, type: f.dataTypeID })),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// A robust schema endpoint for ReactFlow visualization
app.get("/api/schema", async (req, res) => {
  try {
    const tablesQuery = `
      SELECT t.table_name
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    `;
    const tablesResult = await pool.query(tablesQuery);

    const schemaData = [];
    
    // Iterate manually over tables to get their columns, primary keys and foreign keys
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      
      const colsQuery = `
        SELECT 
            c.column_name as name,
            c.data_type as type,
            c.is_nullable,
            (SELECT COUNT(*) FROM information_schema.key_column_usage kcu 
             JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name 
             WHERE tc.constraint_type = 'PRIMARY KEY' AND kcu.table_name = c.table_name AND kcu.column_name = c.column_name
            ) > 0 as is_primary
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = $1
      `;
      const colsResult = await pool.query(colsQuery, [tableName]);
      
      // Look up foreign keys referring to other tables
      const fksQuery = `
        SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
      `;
      const fksResult = await pool.query(fksQuery, [tableName]);
      
      const columns = colsResult.rows.map(col => {
        const fk = fksResult.rows.find(f => f.column_name === col.name);
        return {
          name: col.name,
          type: col.type,
          isPrimary: col.is_primary,
          isForeign: !!fk,
          references: fk ? \`\${fk.foreign_table_name}.\${fk.foreign_column_name}\` : undefined
        };
      });

      schemaData.push({
        id: tableName,
        name: tableName,
        columns
      });
    }

    res.json(schemaData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`Backend server running on port \${PORT}\`);
});
