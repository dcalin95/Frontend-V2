const checkBackendStatus = async (backendUrl) => {
  try {
    const response = await fetch(`${backendUrl}/api/health`);
    if (!response.ok) throw new Error("Backend responded with non-200 status.");
    return { online: true };
  } catch (error) {
    console.error("🔴 Backend unreachable:", error.message);
    return { online: false, error: error.message };
  }
};

export default checkBackendStatus;

