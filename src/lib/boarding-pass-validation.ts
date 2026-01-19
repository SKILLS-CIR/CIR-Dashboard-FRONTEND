export interface BoardingPassResult {
  boardingPassUrl: string;
  passportUrl: string;
  renamedFilename: string;
  campus: string;
}

/**
 * Normalize site name - handles mysore/mysuru variation
 */
function normalizeSiteName(site: string): string {
  const normalized = site.toLowerCase().trim();
  // Map variations to the key used in JSON
  const siteMap: Record<string, string> = {
    "mysuru": "mysore",
    "mysore": "mysore",
    "bengaluru": "bengaluru",
    "bangalore": "bengaluru",
    "coimbatore": "coimbatore",
    "amritapuri": "amritapuri",
  };
  return siteMap[normalized] || normalized;
}

/**
 * Validates the team and site, and returns boarding pass and passport URLs if found.
 * @param teamName Team name to validate
 * @param siteName Campus/site name (case-insensitive)
 * @returns BoardingPassResult or null if not found
 */
export async function validateBoardingPass(teamName: string, siteName: string): Promise<BoardingPassResult | null> {
  if (!teamName || !siteName) return null;
  
  // Normalize site name (handles mysuru -> mysore)
  const site = normalizeSiteName(siteName);
  
  try {
    const res = await fetch("/data/boarding_pass_mappings.json");
    if (!res.ok) return null;
    const mappings = await res.json();
    
    const siteArr = mappings[site];
    if (!Array.isArray(siteArr)) return null;
    
    const found = siteArr.find((item: any) => item.original_filename === teamName);
    
    if (found) {
      const campus = site;
      const renamedFilename = found.renamed_filename;
      const boardingPassPath = `boarding_pass/${campus}/${renamedFilename}_boardingpass.pdf`;
      const passportPath = `passport/${campus}/${renamedFilename}_passport.pdf`;
      const supabaseBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_FLIGHT_DETAILS_URL || "";
      
      return {
        boardingPassUrl: supabaseBaseUrl + boardingPassPath,
        passportUrl: supabaseBaseUrl + passportPath,
        renamedFilename,
        campus,
      };
    }
    return null;
  } catch {
    return null;
  }
}
