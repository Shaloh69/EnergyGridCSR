// Add this to any component to debug your tokens
// You can temporarily add this to your login/register page or create a separate debug component

export const TokenDebugger = () => {
  const debugTokens = () => {
    console.log("🔍 TOKEN DEBUG ANALYSIS");
    console.log("========================");

    // Get tokens from localStorage
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    const user = localStorage.getItem("user");

    console.log("1. Raw Token Data:");
    console.log("   Access Token exists:", !!accessToken);
    console.log("   Refresh Token exists:", !!refreshToken);
    console.log("   User data exists:", !!user);

    if (accessToken) {
      console.log("\n2. Access Token Analysis:");
      console.log("   Length:", accessToken.length);
      console.log("   First 50 chars:", accessToken.substring(0, 50));
      console.log(
        "   Last 50 chars:",
        accessToken.substring(accessToken.length - 50)
      );
      console.log("   Has whitespace:", /\s/.test(accessToken));
      console.log("   Has newlines:", /\n/.test(accessToken));
      console.log("   Parts count:", accessToken.split(".").length);

      // Check each part
      const parts = accessToken.split(".");
      parts.forEach((part, index) => {
        console.log(`   Part ${index + 1} length:`, part.length);
        console.log(
          `   Part ${index + 1} valid base64:`,
          /^[A-Za-z0-9_-]+$/.test(part)
        );
      });

      // Try to decode header (first part)
      try {
        const header = JSON.parse(
          atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"))
        );
        console.log("   Header decoded successfully:", header);
      } catch (e) {
        console.log("   Header decode failed:", e);
      }
    }

    if (refreshToken) {
      console.log("\n3. Refresh Token Analysis:");
      console.log("   Length:", refreshToken.length);
      console.log("   Parts count:", refreshToken.split(".").length);
      console.log("   Has whitespace:", /\s/.test(refreshToken));
    }

    // Test API call
    console.log("\n4. Testing API Call:");
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        console.log("   API Response Status:", response.status);
        console.log("   API Response OK:", response.ok);
        return response.text();
      })
      .then((text) => {
        console.log("   API Response Body:", text);
      })
      .catch((error) => {
        console.log("   API Error:", error);
      });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={debugTokens}
        className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
      >
        Debug Tokens
      </button>
    </div>
  );
};

// Usage: Add this to your login or register page temporarily
// <TokenDebugger />
