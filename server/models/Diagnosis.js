const pool = require('../db/database');

const Diagnosis = {
  async findAll(userId) {
    const { rows } = await pool.query(
      `SELECT d.*, r.full_name AS relative_name, r.relation_type
       FROM diagnoses d
       LEFT JOIN relatives r ON d.relative_id = r.id
       WHERE d.user_id=$1
       ORDER BY d.diagnosed_at DESC NULLS LAST, d.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findOne(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM diagnoses WHERE id=$1 AND user_id=$2', [id, userId]
    );
    return rows[0] || null;
  },

  async create({ user_id, relative_id, icd_code, title, description, diagnosed_at, is_chronic }) {
    const { rows } = await pool.query(
      `INSERT INTO diagnoses (user_id, relative_id, icd_code, title, description, diagnosed_at, is_chronic)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [user_id, relative_id || null, icd_code || null, title, description || null, diagnosed_at || null, is_chronic ? 1 : 0]
    );
    return rows[0].id;
  },

  async update(id, userId, { relative_id, icd_code, title, description, diagnosed_at, is_chronic }) {
    const { rowCount } = await pool.query(
      `UPDATE diagnoses
       SET relative_id=$1, icd_code=$2, title=$3, description=$4, diagnosed_at=$5, is_chronic=$6
       WHERE id=$7 AND user_id=$8`,
      [relative_id || null, icd_code || null, title, description || null, diagnosed_at || null, is_chronic ? 1 : 0, id, userId]
    );
    return { changes: rowCount };
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM diagnoses WHERE id=$1 AND user_id=$2', [id, userId]
    );
    return { changes: rowCount };
  },
};

module.exports = Diagnosis;
