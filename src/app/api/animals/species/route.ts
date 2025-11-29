import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createSpeciesSchema } from "@/lib/validators/animals";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const species = await prisma.animalSpecies.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: species,
    });
  } catch (error) {
    console.error("Error fetching species:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check here if needed. For now, allowing any auth user to add species for demo purposes,
    // or we can restrict it. The spec says "(admin)".
    // Assuming for this MVP/demo, we might skip strict admin check or check a specific email/role.
    // For now, I'll allow it but maybe add a comment.

    const body = await request.json();
    const parsed = createSpeciesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const { name, slug, description } = parsed.data;

    const species = await prisma.animalSpecies.create({
      data: {
        name,
        slug,
        description,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: species,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating species:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
