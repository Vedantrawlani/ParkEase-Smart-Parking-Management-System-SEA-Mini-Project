function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator privileges required.'
    });
  }
  next();
}

function requireFaculty(req, res, next) {
  if (!req.user || (req.user.role !== 'faculty' && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Faculty access required.'
    });
  }
  next();
}

module.exports = {
  requireAdmin,
  requireFaculty
};

