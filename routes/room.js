const express = require("express");
const router = express.Router();
const db = require("../public/function/db");
const logger = require("../logger");
function randNum() {
  return Math.floor(Math.random() * (999999 - 100000) + 100000);
}

//채팅방 생성
router.post("/create", async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    logger.error(`/room/create POST 값이 없음`);
    return res.status(400).json({
      status: "fail",
      message: "need check data",
    });
  }
  try {
    const rnd = randNum();
    const rows = await db(
      `INSERT room (r_num, r_uid) VALUES ("${rnd}", "${uid}")`
    );
    if (rows.length < 1) {
      logger.error(`/room/create POST "${uid}"사용자 방생성 실패`);
      return res.status(500).json({
        status: "fail",
        message: "create room err",
      });
    } else {
      logger.info(`/room/create POST "${uid}"사용자 "${rnd}"채팅방 생성`);
      return res.status(201).json({
        status: "success",
        message: "create room",
        info: {
          rnum: rnd,
          host: uid,
        },
      });
    }
  } catch (error) {
    logger.error(`/room/create POST 서버 에러 "${uid}"사용자 채팅방 생성 실패`);
    return res.status(500).json({
      status: "fail",
      message: "sever err",
    });
  }
});

//채팅방 목록 불러오기
router.get("/list", async (req, res) => {
  const { uid } = req.query;
  if (!uid) {
    logger.error(`/room/list GET 값이 없음`);
    res.status(400).json({
      status: "fail",
      message: "need check data",
    });
  }
  try {
    const rows = await db(`
      SELECT
      r_id as rid,
      r_num as rnum
      FROM
      room
      WHERE r_uid="${uid}"
    `);
    logger.info(`/room/list GET "${uid}"사용자 채팅방 목록 불러오기 성공`);
    return res.status(200).json({
      status: "success",
      message: "load list",
      info: rows,
    });
  } catch (error) {
    logger.error(
      `/room/list GET 서버에러 "${uid}"사용자 채팅방 목록 불러오기 실패`
    );
    return res.status(500).json({
      status: "fail",
      message: "load list fail",
    });
  }
});

//채팅방 입장시 정보 불러오기
router.get("/load/:rnum", async (req, res) => {
  const { rnum } = req.params;
  const { uid } = req.query;
  if (!uid || !rnum) {
    logger.error(`/room/load GET 값이 없음`);
    res.status(400).json({
      status: "fail",
      message: "need check data",
    });
  }
  try {
    const rows = await db(`
    SELECT+
    r.r_num as rnum,
    r.r_uid as ruid,
    u.u_nick as nick
    FROM
    room r JOIN user u ON r.r_uid=u.u_id
    WHERE r_num = "${rnum}"
    `);
    const rows2 = await db(`
    SELECT COUNT(case when r_num = "${rnum}" then 1 end)as user_count FROM room
    `);
    logger.info(
      `/room/load GET "${uid}"사용자 "${rnum}"채팅방 정보 불러오기 성공`
    );
    return res.status(200).json({
      status: "success",
      message: "load list",
      user_count: rows2,
      info: rows,
    });
  } catch (error) {
    logger.error(
      `/room/load GET 서버에러 "${uid}"사용자 "${rnum}"채팅방 정보 불러오기 실패`
    );
    return res.status(500).json({
      status: "fail",
      message: "load list fail",
    });
  }
});

module.exports = router;

// //채팅방 참가(사용자를 리스트에 추가)
// router.post("/enter", async (req, res) => {
//   const { uid, rnum } = req.body;
//   if (!uid || !rnum) {
//     logger.error(`/room/enter POST 값이 없음`);
//     return res.status(400).json({
//       status: "fail",
//       message: "need check data",
//     });
//   }
//   try {
//     const rows = await db(`
//       INSERT
//       entry
//       (e_rid, e_uid)
//       VALUES
//       ((SELECT r_id FROM room WHERE r_num="${rnum}"),"${uid}")
//     `);
//     logger.info(`/room/enter POST "${uid}"사용자 "${rnum}"채팅방 참가`);
//     return res.status(201).json({
//       status: "success",
//       message: "enter room",
//     });
//   } catch (error) {
//     logger.error(
//       `/room/enter POST 서버에러 "${uid}"사용자 "${rnum}"채팅방 참가 실패`
//     );
//     return res.status(500).json({
//       status: "fail",
//       message: "sever err",
//     });
//   }
// });

// //채팅방 퇴장
// router.delete("/exit", async (req, res) => {
//   const { uid, rnum } = req.body;
//   if (!uid || !rnum) {
//     logger.error(`값이 없음`);
//     return res.status(400).json({
//       status: "fail",
//       message: "need check data",
//     });
//   }
//   try {
//     const rows = await db(`
//     DELETE
//     FROM
//     entry
//     WHERE e_rid=(SELECT r_id FROM room WHERE r_num="${rnum}")
//     AND e_uid="${uid}"
//   `);
//     if (rows.affectedRows < 1) {
//       logger.error(`"${uid}"사용자 "${rnum}"채팅방 퇴장 실패`);
//       return res.status(500).json({
//         status: "fail",
//         message: "exit fail",
//       });
//     } else {
//       logger.info(`"${uid}"사용자 "${rnum}"채팅방 퇴장`);
//       return res.status(200).json({
//         status: "success",
//         message: "exit room",
//       });
//     }
//   } catch (error) {
//     logger.error(`서버에러 "${uid}"사용자 "${rnum}"채팅방 퇴장 실패`);
//     return res.status(500).json({
//       status: "fail",
//       message: "sever err",
//     });
//   }
// });
