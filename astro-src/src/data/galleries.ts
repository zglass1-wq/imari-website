// The canonical galleries used by most pages.
// Edit here once; every page that doesn't override picks it up.
// Extracted verbatim from july4.html's inline GALLERIES object.

const CLD = 'https://res.cloudinary.com/dsp45h9a1/image/upload/f_auto,q_auto/';

export interface Photo {
  src: string;
  alt: string;
}
export interface Subgallery {
  label: string;
  photos: Photo[];
}
export type Galleries = Record<string, Subgallery>;

export const defaultGalleries: Galleries = {
  interior: {
    label: 'Interior',
    photos: [
      { src: CLD + 'Living_Room_280_i5lyva.jpg', alt: 'Living Room' },
      { src: CLD + 'Dining_105_xyaxbx.jpg', alt: 'Dining Room' },
      { src: CLD + 'GT_Bedroom_245_j5ffcp.jpg', alt: 'Georgetown Suite' },
      { src: CLD + 'GT_Bath_544_zjd6ff.jpg', alt: 'Georgetown Suite Bath' },
      { src: CLD + 'Parlor_and_Living_Room_421_ycl671.jpg', alt: 'Parlor and Living Room' },
      { src: CLD + 'Parlor_361_ark39j.jpg', alt: 'Parlor' },
      { src: CLD + 'Kitchen_154_avquj8.jpg', alt: 'Kitchen' },
      { src: CLD + 'Living_Room_331_spepzh.jpg', alt: 'Living Room' },
      { src: CLD + 'Parlor_373_vkelnj.jpg', alt: 'Parlor' },
      { src: CLD + 'Parlor_410_xj8g1z.jpg', alt: 'Parlor' },
      { src: CLD + 'Parlor_390_lktsk9.jpg', alt: 'Parlor' },
      { src: CLD + 'Sunroom_179_ggdnkh.jpg', alt: 'Sunroom / Orangerie' },
      { src: CLD + 'Foyer_479_kfbbnh.jpg', alt: 'Foyer' },
      { src: CLD + 'Stairs_with_Chair_465_clsrg0.jpg', alt: 'Staircase' },
      { src: CLD + 'DC_-_Bar_kdizki.jpg', alt: 'Bar' },
      { src: CLD + 'GT_Office_207_lsjhg8.jpg', alt: 'Office / Study' },
      { src: CLD + 'Dining_AND_Kitchen_166_dleo0l.jpg', alt: 'Dining and Kitchen' },
      { src: CLD + 'Dining_Room_Detail_451_kv9zwm.jpg', alt: 'Dining Room Detail' },
      { src: CLD + 'Dining_Bar_Cart_126_rtdr2u.jpg', alt: 'Dining Bar Cart' },
      { src: CLD + 'Kitchen_134_s5cazd.jpg', alt: 'Kitchen' },
      { src: CLD + 'Premier_611_fksc2s.jpg', alt: 'Premier Suite' },
      { src: CLD + 'Premier_Bath_633_aa3abf.jpg', alt: 'Premier Suite Bath' },
      { src: CLD + 'Premier_Closet_642_qzbb9i.jpg', alt: 'Premier Suite Closet' },
      { src: CLD + 'GT_Bath_568_vgfoie.jpg', alt: 'Georgetown Suite Bath' },
      { src: CLD + 'GT_Her_Closet_594_zgfrgl.jpg', alt: 'Dressing Room' },
      { src: CLD + 'Executive_014_w1rp8a.jpg', alt: 'Executive Suite' },
      { src: CLD + 'Executive_Bath_040_cp3scq.jpg', alt: 'Executive Suite Bath' },
      { src: CLD + 'Deluxe_2_061_txugmc.jpg', alt: 'Suite' },
    ],
  },
  exterior: {
    label: 'Exterior',
    photos: [
      { src: CLD + 'LXIVDC_GARDENS064_ybjkpl.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS125_zpibxr.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS046_q59bby.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS194_dzlttv.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS184_jgnpcn.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS026_nx1u73.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS056_oed2fk.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS052_ccsvbe.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS007_q2e2y0.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS073_d8t7nt.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS089_zmpr9g.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS102_bv6kmk.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS103_rqir72.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS113_v7dpbk.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS134_d5aklw.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS147_yvgkkd.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS035_ly1k2d.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS157_wtqzaq.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS169_kg6m0s.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS201_hodm01.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS218_v7wjnb.jpg', alt: 'Gardens' },
      { src: CLD + 'LXIVDC_GARDENS223_klaapo.jpg', alt: 'Gardens' },
      { src: CLD + 'Spa_House_1058_d3cilj.jpg', alt: 'Spa House' },
    ],
  },
  'site-plan': {
    label: 'Site Plan',
    photos: [
      { src: CLD + 'GardenPlan_qkwnln.png', alt: 'Garden Plan' },
      { src: CLD + 'FirstFloorPlan_jyuexv.png', alt: 'First Floor Plan' },
      { src: CLD + 'SecondFloorPlan_a9lyke.png', alt: 'Second Floor Plan' },
      { src: CLD + 'ThirdFloorPlan_yq3lno.png', alt: 'Third Floor Plan' },
      { src: CLD + 'Ballroom-BANQUETDINING_hyqzx6.jpg', alt: 'Ballroom — Banquet Dining' },
      { src: CLD + 'Ballroom-SEATEDDINING_ykemyx.jpg', alt: 'Ballroom — Seated Dining' },
      { src: CLD + 'Ballroom-BOARDMEETING_kbtijh.jpg', alt: 'Ballroom — Board Meeting' },
      { src: CLD + 'Ballroom-LECTURE_nil4at.jpg', alt: 'Ballroom — Lecture' },
    ],
  },
};
