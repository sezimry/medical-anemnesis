const pool = require('../db/database');

const Relative = {
  async findAll(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM relatives WHERE user_id=$1 ORDER BY created_at ASC', [userId]
    );
    return rows;
  },

  async findOne(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM relatives WHERE id=$1 AND user_id=$2', [id, userId]
    );
    return rows[0] || null;
  },

  async create({ user_id, full_name, birth_date, gender, relation_type, parent_relative_id, notes }) {
    const { rows } = await pool.query(
      `INSERT INTO relatives (user_id, full_name, birth_date, gender, relation_type, parent_relative_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [user_id, full_name, birth_date || null, gender || null, relation_type, parent_relative_id || null, notes || null]
    );
    return rows[0].id;
  },

  async update(id, userId, { full_name, birth_date, gender, relation_type, parent_relative_id, notes }) {
    const { rowCount } = await pool.query(
      `UPDATE relatives
       SET full_name=$1, birth_date=$2, gender=$3, relation_type=$4, parent_relative_id=$5, notes=$6
       WHERE id=$7 AND user_id=$8`,
      [full_name, birth_date || null, gender || null, relation_type, parent_relative_id || null, notes || null, id, userId]
    );
    return { changes: rowCount };
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM relatives WHERE id=$1 AND user_id=$2', [id, userId]
    );
    return { changes: rowCount };
  },
};

module.exports = Relative;
