const pool = require('../db/database');

const Allergy = {
  async findAll(userId) {
    const { rows } = await pool.query(
      `SELECT a.*, r.full_name AS relative_name, r.relation_type
       FROM allergies a
       LEFT JOIN relatives r ON a.relative_id = r.id
       WHERE a.user_id=$1
       ORDER BY a.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findOne(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM allergies WHERE id=$1 AND user_id=$2', [id, userId]
    );
    return rows[0] || null;
  },

  async create({ user_id, relative_id, allergen, reaction, severity }) {
    const { rows } = await pool.query(
      `INSERT INTO allergies (user_id, relative_id, allergen, reaction, severity)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [user_id, relative_id || null, allergen, reaction || null, severity || null]
    );
    return rows[0].id;
  },

  async update(id, userId, { relative_id, allergen, reaction, severity }) {
    const { rowCount } = await pool.query(
      `UPDATE allergies SET relative_id=$1, allergen=$2, reaction=$3, severity=$4
       WHERE id=$5 AND user_id=$6`,
      [relative_id || null, allergen, reaction || null, severity || null, id, userId]
    );
    return { changes: rowCount };
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM allergies WHERE id=$1 AND user_id=$2', [id, userId]
    );
    return { changes: rowCount };
  },
};

module.exports = Allergy;
