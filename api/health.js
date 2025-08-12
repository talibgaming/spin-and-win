export default async function handler(req, res) {
  res.status(200).json({ ok: true });
}
module.exports = (req, res) => {
  res.status(200).json({ status: "OK" });
};
