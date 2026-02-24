import { readFile } from "fs/promises";
import { join } from "path";

const RESUME_PATH = join(process.cwd(), "public", "Kuek_Resume_2026.pdf");

export async function GET() {
  const file = await readFile(RESUME_PATH);

  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Kuek_Resume_2026.pdf"',
    },
  });
}
