"use client";

import React from "react";
import type { ThemeOverrides } from "@/lib/themes/types";
import { BusinessBookingPage } from "@/components/booking-page/BusinessBookingPage";

export interface ThemedPageRendererProps {
  business: any;
  services: any[];
  employees: any[];
  reviews: any[];
  workingHours?: any[];
  appointments?: any[];
  gallery?: any;
  galleryItems?: any[];
  /** Theme picked in the dashboard; recolors the booking page. */
  themeId?: string | null;
  themeOverrides?: ThemeOverrides | null;
  /** Kept for the page builder; the booking page uses a fixed section order. */
  sectionOrder?: string[] | null;
  hiddenSections?: string[] | null;
  customBlocks?: any[] | null;
  previewDevice?: "desktop" | "tablet" | "mobile";
}

/**
 * Entry point for the public business page (/[slug]) and the dashboard's live preview.
 * The chosen theme sets the page colors; section visibility, custom title/description/cover,
 * contact shortcuts and the owner's accent color also come from the page builder settings.
 */
export function ThemedPageRenderer({
  business,
  services = [],
  employees = [],
  reviews = [],
  workingHours = [],
  gallery = null,
  galleryItems = [],
  themeId = "premium-dark",
  themeOverrides = null,
  hiddenSections = [],
  previewDevice,
}: ThemedPageRendererProps) {
  return (
    <BusinessBookingPage
      business={business}
      services={services}
      employees={employees}
      reviews={reviews}
      workingHours={workingHours}
      gallery={gallery}
      galleryItems={galleryItems}
      themeId={themeId}
      themeOverrides={themeOverrides}
      hiddenSections={hiddenSections}
      previewDevice={previewDevice}
    />
  );
}
