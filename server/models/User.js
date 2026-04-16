const pool = require('../db/database');

const User = {
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, birth_date, gender, created_at FROM users WHERE id = $1', [id]
    );
    return rows[0] || null;
  },

  async create({ email, password, full_name, birth_date, gender }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password, full_name, birth_date, gender)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [email, password, full_name, birth_date || null, gender || null]
    );
    return rows[0].id;
  },

  async update(id, { full_name, birth_date, gender }) {
    await pool.query(
      `UPDATE users SET full_name=$1, birth_date=$2, gender=$3 WHERE id=$4`,
      [full_name, birth_date || null, gender || null, id]
    );
  },

  async updatePassword(id, hashedPassword) {
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashedPassword, id]);
  },

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
  },
};

module.exports = User;
