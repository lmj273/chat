const express = require("express");
const router = express.Router();
const db = require("../public/function/db");
const logger = require("../logger");

//메세지 불러오기
router.get("/load/:rid", async (req, res) => {
  const { rid } = req.params;
  let { page, count } = req.query;
  if (!count) {
    count = 10;
  }
  if (!page || page < 1) {
    page = 0;
  }
  if (!rid) {
    logger.error(`값이 없음`);
    return res.status(400).json({
      status: "fail",
      message: "need check data",
    });
  }
  try {
    const rows = await db(`
    SELECT
    m.m_id as mid,
    m.m_uid as uid,
    u.u_nick as nick,
    m.m_content as content,
    m.m_date as date
    FROM
    message m JOIN user u ON m.m_uid=u.u_id
    WHERE m_rid = "${rid}"
    ORDER BY m.m_date ASC LIMIT ${page * count},${count}
  `);
    logger.info(`"${rid}"채팅방 메세지 불러오기 성공`);
    return res.status(200).json({
      status: "success",
      message: "load message",
      info: {
        rows,
      },
    });
  } catch (error) {
    logger.error(`서버에러`);
    return res.status(500).json({
      status: "fail",
      message: "sever err",
    });
  }
});

module.exports = router;
