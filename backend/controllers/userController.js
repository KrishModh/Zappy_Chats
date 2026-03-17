import User from '../models/User.js';

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  return res.json(user);
};

export const searchUsers = async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) return res.json([]);

  const users = await User.find({
    username: { $regex: query, $options: 'i' },
    _id: { $ne: req.user.id }
  })
    .select('fullName username profilePic')
    .limit(20);

  return res.json(users);
};
