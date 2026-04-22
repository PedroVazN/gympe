const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

const toSimpleUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

exports.sendRequest = async (req, res) => {
  const { email } = req.body;
  const me = req.user.id;
  const target = await User.findOne({ email: String(email).toLowerCase() });

  if (!target) return res.status(404).json({ message: "Usuário não encontrado." });
  if (String(target._id) === String(me)) {
    return res.status(400).json({ message: "Você não pode adicionar a si mesmo." });
  }

  const existing = await FriendRequest.findOne({
    $or: [
      { fromUserId: me, toUserId: target._id },
      { fromUserId: target._id, toUserId: me },
    ],
  });

  if (existing?.status === "accepted") {
    return res.status(400).json({ message: "Vocês já são amigos." });
  }
  if (existing?.status === "pending") {
    return res.status(400).json({ message: "Já existe solicitação pendente." });
  }

  const request = await FriendRequest.create({
    fromUserId: me,
    toUserId: target._id,
    status: "pending",
  });

  return res.status(201).json(request);
};

exports.listRequests = async (req, res) => {
  const me = req.user.id;
  const incoming = await FriendRequest.find({ toUserId: me, status: "pending" }).populate(
    "fromUserId",
    "name email"
  );
  const outgoing = await FriendRequest.find({ fromUserId: me, status: "pending" }).populate(
    "toUserId",
    "name email"
  );

  return res.json({
    incoming: incoming.map((item) => ({
      id: item._id,
      from: toSimpleUser(item.fromUserId),
      createdAt: item.createdAt,
    })),
    outgoing: outgoing.map((item) => ({
      id: item._id,
      to: toSimpleUser(item.toUserId),
      createdAt: item.createdAt,
    })),
  });
};

exports.respondRequest = async (req, res) => {
  const me = req.user.id;
  const { action } = req.body; // accept | reject
  const request = await FriendRequest.findOne({
    _id: req.params.id,
    toUserId: me,
    status: "pending",
  });
  if (!request) return res.status(404).json({ message: "Solicitação não encontrada." });

  request.status = action === "accept" ? "accepted" : "rejected";
  await request.save();
  return res.json({ message: "Solicitação atualizada." });
};

exports.listFriends = async (req, res) => {
  const me = req.user.id;
  const accepted = await FriendRequest.find({
    status: "accepted",
    $or: [{ fromUserId: me }, { toUserId: me }],
  })
    .populate("fromUserId", "name email")
    .populate("toUserId", "name email");

  const friends = accepted.map((item) => {
    const friend =
      String(item.fromUserId._id) === String(me) ? item.toUserId : item.fromUserId;
    return toSimpleUser(friend);
  });

  return res.json(friends);
};
