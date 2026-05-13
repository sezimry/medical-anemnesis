function requireDoctor(req, res, next) {
  if (req.userRole !== 'doctor') {
    return res.status(403).json({ error: 'Доступ только для врачей' });
  }
  next();
}

module.exports = requireDoctor;
