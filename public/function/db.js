const mariadb = require("mariadb");
const pool = mariadb.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  port: process.env.dbport,
  database: process.env.database,
  supportBigNumbers: true,
  bigNumberStrings: true,
});
async function asyncSQL(sql) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql);
    return rows;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = asyncSQL;
