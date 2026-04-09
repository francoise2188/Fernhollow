import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { getErrorMessage } from "@/lib/errors";
import { completeTask, failTask, startTask } from "@/lib/fernhollow-tasks";
import { runMonthlyRecapsForAllHouses } from "@/lib/conversation-recap";
import {
  generateWrenIncomeNote,
  previousMonthString,
} from "@/lib/income-notes";

export const runtime = "nodejs";

/** 1st of month: Wren monthly treasury note (previous calendar month). */
export async function GET(request: Request) {
  const gate = verifyCronRequest(request);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reason ?? "Forbidden" },
      { status: 401 },
    );
  }

  let taskId: string | null = null;
  try {
    const { id } = await startTask({
      agent: "wren",
      taskType: "income_report",
      business: "fernhollow",
    });
    taskId = id;

    const month = previousMonthString();
    const { contentId } = await generateWrenIncomeNote({
      month,
      mode: "monthly",
    });

    const summary = `Monthly income draft saved for ${month}. Content id: ${contentId}`;
    await completeTask(taskId, summary);

    let recapResults: { slug: string; result: string }[] = [];
    try {
      recapResults = await runMonthlyRecapsForAllHouses({ month });
    } catch (recapErr) {
      console.error("[monthly-income] recap cron", recapErr);
    }

    return NextResponse.json({
      ok: true,
      month,
      contentId,
      taskId,
      recaps: recapResults,
    });
  } catch (e) {
    console.error(e);
    const msg = getErrorMessage(e);
    if (taskId) await failTask(taskId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
