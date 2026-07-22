import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Hook your error-monitoring service (Sentry, etc.) here.
    console.error("Orree app crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-green-deep text-cream flex flex-col items-center justify-center px-6 text-center font-body">
          <h1 className="font-display font-bold text-2xl mb-3">দুঃখিত, কিছু একটা গণ্ডগোল হয়েছে</h1>
          <p className="text-cream/60 max-w-sm mb-8 leading-relaxed">
            পেজটা লোড করতে সমস্যা হচ্ছে। একটু রিফ্রেশ করে আবার চেষ্টা করুন — সমস্যা থাকলে আমাদের হোয়াটসঅ্যাপে জানান।
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-7 py-3.5 font-display font-semibold text-cream"
          >
            পেজ রিফ্রেশ করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
