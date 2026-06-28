export interface UpscSegmentCopyBlock {
  emailBrandLineEn: string;
  emailBrandTaglineEn: string;
  emailLeadEn: string;
  emailFeaturesEn: string[];
  emailSubjectEn: string;
  bulletsEn: string[];
  bulletsHi: string[];
}

export const DEFAULT_UPSC_PRODUCT_COPY = {
  mains: {
    bulletsEn: [
      'Topic-wise Syllabus Mapping',
      'Detailed PYQ Solutions',
      'Expert Answer Writing Strategies',
      'Unlimited Cloud Storage for Notes',
      'Instant AI Doubt Resolution'
    ],
    bulletsHi: [
      'विषय-वार सिलेबस मैपिंग',
      'विस्तृत PYQ समाधान',
      'विशेषज्ञ उत्तर लेखन रणनीतियां',
      'नोट्स के लिए असीमित क्लाउड स्टोरेज',
      'त्वरित AI डाउट रिज़ॉल्यूशन'
    ],
    emailBrandLineEn: 'UPSC Mains Premium',
    emailBrandTaglineEn: 'Master your Mains preparation',
    emailLeadEn: 'Welcome to UPSC Mains Premium!',
    emailFeaturesEn: [
      'Topic-wise Syllabus Mapping',
      'Detailed PYQ Solutions',
      'Expert Answer Writing Strategies'
    ],
    emailSubjectEn: 'Your UPSC Mains Premium Access is Ready!'
  } as UpscSegmentCopyBlock
};
