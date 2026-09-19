/**
 * Utilities for serializing and deserializing student schedule selections to/from URL search params.
 * Allows students to easily share their exact custom course & group layout via a compact URL.
 */

export interface ShareableScheduleState {
  courseIds: string[];
  practicalGroups: Record<string, string>;
  gender?: 'male' | 'female';
}

/**
 * Encodes the schedule state into compact URL query parameters.
 * Format:
 *   courses=c1,c2,c4,c7
 *   groups=c1:c1_p2,c2:c2_p1
 *   g=male | female (optional)
 */
export function encodeScheduleToParams(state: ShareableScheduleState): string {
  const params = new URLSearchParams();

  if (state.courseIds.length > 0) {
    params.set('courses', state.courseIds.join(','));
  }

  const groupEntries = Object.entries(state.practicalGroups).filter(
    ([courseId, groupId]) => courseId && groupId && state.courseIds.includes(courseId)
  );

  if (groupEntries.length > 0) {
    const serializedGroups = groupEntries
      .map(([cId, gId]) => `${cId}:${gId}`)
      .join(',');
    params.set('groups', serializedGroups);
  }

  if (state.gender) {
    params.set('g', state.gender);
  }

  return params.toString();
}

/**
 * Builds a full shareable URL based on current window location and schedule state.
 */
export function buildShareableUrl(state: ShareableScheduleState): string {
  if (typeof window === 'undefined') return '';
  const queryString = encodeScheduleToParams(state);
  const base = `${window.location.origin}${window.location.pathname}`;
  return queryString ? `${base}?${queryString}` : base;
}

/**
 * Decodes schedule state from search string or URLSearchParams.
 * Returns null if no relevant parameters are present.
 */
export function decodeScheduleFromParams(search: string): ShareableScheduleState | null {
  if (!search) return null;

  try {
    const params = new URLSearchParams(search);
    const coursesParam = params.get('courses');
    const groupsParam = params.get('groups');
    const genderParam = params.get('g');

    if (!coursesParam && !groupsParam && !genderParam) {
      return null;
    }

    const courseIds = coursesParam
      ? coursesParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const practicalGroups: Record<string, string> = {};
    if (groupsParam) {
      const parts = groupsParam.split(',');
      for (const part of parts) {
        const [cId, gId] = part.split(':').map((s) => s.trim());
        if (cId && gId) {
          practicalGroups[cId] = gId;
        }
      }
    }

    const gender =
      genderParam === 'female' || genderParam === 'male'
        ? (genderParam as 'male' | 'female')
        : undefined;

    return {
      courseIds,
      practicalGroups,
      gender,
    };
  } catch (err) {
    console.error('Failed to parse schedule URL params:', err);
    return null;
  }
}

/**
 * Updates browser history in-place with current URL query parameters without triggering a full page reload.
 */
export function syncScheduleToUrl(state: ShareableScheduleState): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  const queryString = encodeScheduleToParams(state);
  const newUrl = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;

  window.history.replaceState(null, '', newUrl);
}
