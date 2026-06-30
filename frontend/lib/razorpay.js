// Lazily inject the Razorpay Checkout script once and resolve when ready.
let loaderPromise = null;

export function loadRazorpay() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      loaderPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return loaderPromise;
}
