/**
 * GlueStack E-Learning & Training Template
 * Inspired by Applighter React Native E-Learning App Template
 * Mobile shopfloor worker training, skill certification, and interactive microlearning platform
 * Builder Type: gluestack
 */
export function createGluestackELearningTemplate() {
    return {
        id: 'gluestack_elearning_' + Date.now(),
        name: 'GlueStack — E-Learning & Skill Hub',
        description: 'Aplikasi mobile e-learning dan sertifikasi operator industri lengkap: discovery modul pelatihan, video lesson player, silabus kurikulum, progress tracking dengan streak, dan sertifikat digital.',
        builder_type: 'gluestack',
        category: 'GlueStack App',
        config: {
            appTables: ['tbl_gs_learning_progress'],
            screens: [
                // SCREEN 1: SIGN IN / AUTH
                {
                    id: 'screen_auth',
                    title: 'Sign In — Mavi Learning',
                    components: [
                        {
                            id: 'auth_logo_header',
                            type: 'Text',
                            props: { text: '🎓 Mavi Learning Hub', size: 'xl', bold: true }
                        },
                        {
                            id: 'auth_badge',
                            type: 'Badge',
                            props: { text: 'INDUSTRIAL ACADEMY • PRO', action: 'success' }
                        },
                        {
                            id: 'auth_subtitle',
                            type: 'Text',
                            props: { text: 'Platform Pelatihan Mandiri & Sertifikasi Operator Terstandarisasi', size: 'sm', bold: false }
                        },
                        {
                            id: 'auth_email',
                            type: 'Input',
                            props: { label: 'Email atau NIK Operator', placeholder: 'contoh: budi.s@company.id atau NIK-240891' }
                        },
                        {
                            id: 'auth_password',
                            type: 'Input',
                            props: { label: 'Kata Sandi / PIN', placeholder: '••••••••', isPassword: true }
                        },
                        {
                            id: 'auth_remember',
                            type: 'Checkbox',
                            props: { label: 'Ingat Akun Saya di Tablet Ini', checked: true }
                        },
                        {
                            id: 'auth_btn_login',
                            type: 'Button',
                            props: { text: 'Masuk ke Platform Belajar ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        },
                        {
                            id: 'auth_info',
                            type: 'Alert',
                            props: { title: 'Akses Standar Pabrik', message: 'Gunakan NIK aktif Anda untuk auto-sinkronisasi progres dengan database HR & Skill Matrix.' }
                        }
                    ],
                    triggers: []
                },

                // SCREEN 2: DISCOVER / BERANDA KURSUS
                {
                    id: 'screen_discover',
                    title: 'Discover Courses',
                    components: [
                        {
                            id: 'disc_user_row',
                            type: 'Avatar',
                            props: { name: 'Budi Santoso' }
                        },
                        {
                            id: 'disc_greeting',
                            type: 'Text',
                            props: { text: 'Halo, Budi Santoso 👋', size: 'lg', bold: true }
                        },
                        {
                            id: 'disc_sub',
                            type: 'Text',
                            props: { text: 'Lanjutkan peningkatan kompetensi lini perakitan hari ini', size: 'sm' }
                        },
                        {
                            id: 'disc_search',
                            type: 'Input',
                            props: { label: 'Pencarian Modul', placeholder: '🔍 Cari materi Lean, 5S, PLC, QC...' }
                        },
                        {
                            id: 'disc_featured_badge',
                            type: 'Badge',
                            props: { text: '🔥 KURSUS UNGGULAN MINGGU INI', action: 'info' }
                        },
                        {
                            id: 'disc_featured_card',
                            type: 'Card',
                            props: {
                                title: '⚡ Industrial IoT & Smart Machine Automation',
                                content: 'Pelajari dasar-dasar integrasi sensor PLC, SCADA real-time monitoring, dan deteksi dini anomali mesin.\n\n⭐ 4.9 (1,420 operator) • ⏱️ 12 Jam • 24 Modul'
                            }
                        },
                        {
                            id: 'disc_btn_open_featured',
                            type: 'Button',
                            props: { text: 'Lihat Silabus Lengkap ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        },
                        {
                            id: 'disc_tabs_cat',
                            type: 'Tabs',
                            props: {
                                tabs: ['Semua', 'Lean Ops', 'Quality Control', 'K3 & Safety', 'PLC & Robot']
                            }
                        },
                        {
                            id: 'disc_item_1',
                            type: 'ListItem',
                            props: {
                                title: 'Dasar 5S & Standarisasi Kerja',
                                subtitle: 'Metodologi penataan tempat kerja untuk meminimalkan waste',
                                badge: '4.8 ★ (8 Modul)',
                                value: 'GRATIS'
                            }
                        },
                        {
                            id: 'disc_item_2',
                            type: 'ListItem',
                            props: {
                                title: 'Pengukuran Dimensi & Kalibrasi Presisi (QC)',
                                subtitle: 'Teknik menggunakan micrometer, caliper, dan toleransi ISO',
                                badge: '4.9 ★ (12 Modul)',
                                value: 'SERTIFIKASI'
                            }
                        },
                        {
                            id: 'disc_item_3',
                            type: 'ListItem',
                            props: {
                                title: 'K3 Kebakaran & Tanggap Darurat Pabrik',
                                subtitle: 'Prosedur keselamatan darurat, APAR, dan evakuasi zona merah',
                                badge: '5.0 ★ (6 Modul)',
                                value: 'WAJIB SHIFT'
                            }
                        },
                        {
                            id: 'disc_item_4',
                            type: 'ListItem',
                            props: {
                                title: 'Total Productive Maintenance (TPM) Praktis',
                                subtitle: 'Otonomi pemeliharaan mesin harian bagi operator lini',
                                badge: '4.7 ★ (10 Modul)',
                                value: 'LANJUTAN'
                            }
                        }
                    ],
                    triggers: []
                },

                // SCREEN 3: COURSE DETAIL & CURRICULUM
                {
                    id: 'screen_course_detail',
                    title: 'Course Detail — Lean & 5S',
                    components: [
                        {
                            id: 'det_badge_status',
                            type: 'Badge',
                            props: { text: 'TERAKREDITASI • LEVEL OPERATOR 2', action: 'success' }
                        },
                        {
                            id: 'det_title',
                            type: 'Text',
                            props: { text: 'Metodologi 5S & Lean Shopfloor Mastery', size: 'xl', bold: true }
                        },
                        {
                            id: 'det_instructor',
                            type: 'Card',
                            props: {
                                title: '👨‍🏫 Instruktur Utama',
                                content: 'Dr. Ir. Hendra Gunawan, MT\nMaster Black Belt Lean Manufacturing • 18+ Tahun Pengalaman Otomotif'
                            }
                        },
                        {
                            id: 'det_teaser_video',
                            type: 'VideoPlayer',
                            props: {
                                title: 'Teaser Video: Transformasi Shopfloor dengan 5S',
                                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                            }
                        },
                        {
                            id: 'det_overview',
                            type: 'Card',
                            props: {
                                title: '📋 Ringkasan Kompetensi',
                                content: 'Kursus intensif ini mempersiapkan operator garis depan untuk mengenali 7 jenis pemborosan (Muda), menerapkan standar Seiri-Seiton-Seiso-Seiketsu-Shitsuke, serta mengoperasikan Andon Board secara tepat sasaran.'
                            }
                        },
                        {
                            id: 'det_mod1',
                            type: 'Accordion',
                            props: {
                                title: 'Modul 1: Pengenalan 5S & Budaya Kerja Rapi (45 min)',
                                content: 'Pengertian Seiri (Ringkas), Seiton (Rapi), Seiso (Resik), Seiketsu (Rawat), dan Shitsuke (Rajin). Studi kasus implementasi di pabrik manufaktur modern.'
                            }
                        },
                        {
                            id: 'det_mod2',
                            type: 'Accordion',
                            props: {
                                title: 'Modul 2: Eliminasi 7 Pemborosan / Waste di Shopfloor (60 min)',
                                content: 'Mengenali Overproduction, Waiting, Transport, Overprocessing, Inventory, Motion, dan Defects (TIMWOODS).'
                            }
                        },
                        {
                            id: 'det_mod3',
                            type: 'Accordion',
                            props: {
                                title: 'Modul 3: Visual Management & Standarisasi Kerja (50 min)',
                                content: 'Penggunaan Red Tag Area, Shadow Board perkakas, indikator batas min/max, dan Standar Operasional Prosedur (SOP) visual.'
                            }
                        },
                        {
                            id: 'det_mod4',
                            type: 'Accordion',
                            props: {
                                title: 'Modul 4: Ujian Evaluasi & Asesmen Sertifikat (30 min)',
                                content: '20 soal pilihan ganda interaktif + studi kasus visual. Syarat kelulusan nilai minimum: 80%.'
                            }
                        },
                        {
                            id: 'det_btn_enroll',
                            type: 'Button',
                            props: { text: 'Mulai Pelatihan Sekarang 🚀', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },

                // SCREEN 4: ACTIVE LESSON PLAYER
                {
                    id: 'screen_lesson_player',
                    title: 'Lesson — Modul 3: Visual Management',
                    components: [
                        {
                            id: 'les_current_header',
                            type: 'Text',
                            props: { text: 'Modul 3 • Visual Management & Shadow Board', size: 'lg', bold: true }
                        },
                        {
                            id: 'les_video',
                            type: 'VideoPlayer',
                            props: {
                                title: 'Video Pelatihan: Pembuatan Shadow Board di Stasiun Perakitan',
                                src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                            }
                        },
                        {
                            id: 'les_progress',
                            type: 'Progress',
                            props: { value: 65, label: 'Penyelesaian Modul: 65%' }
                        },
                        {
                            id: 'les_tabs',
                            type: 'Tabs',
                            props: {
                                tabs: ['Catatan Materi', 'SOP Visual', 'Kuis Pemahaman']
                            }
                        },
                        {
                            id: 'les_key_points',
                            type: 'Card',
                            props: {
                                title: '📌 Poin Kunci Praktik',
                                content: '1. Setiap perkakas kerja wajib memiliki garis outline siluet merah/kuning.\n2. Label nama alat dan kode part harus dapat dibaca dari jarak 1 meter.\n3. Periksa ketersediaan alat setiap awal & akhir shift kerja.'
                            }
                        },
                        {
                            id: 'les_check_1',
                            type: 'Checkbox',
                            props: { label: 'Saya telah memahami prinsip penataan Shadow Board', checked: true }
                        },
                        {
                            id: 'les_check_2',
                            type: 'Checkbox',
                            props: { label: 'Saya siap menerapkan verifikasi visual di stasiun kerja saya', checked: true }
                        },
                        {
                            id: 'les_signature',
                            type: 'Signature',
                            props: {
                                label: 'Tanda Tangan Komitmen Operator',
                                placeholder: 'Bubuhkan tanda tangan elektronik di sini'
                            }
                        },
                        {
                            id: 'les_btn_complete',
                            type: 'Button',
                            props: { text: 'Selesaikan Modul & Lanjut ➔', variant: 'positive', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: [
                        {
                            id: 'trig_save_progress',
                            event: 'ON_CLICK',
                            action: 'SAVE_TO_TABLE',
                            target: 'tbl_gs_learning_progress',
                            payload: {
                                User_NIK: 'OPERATOR_NIK',
                                Course_Title: 'Metodologi 5S & Lean Shopfloor Mastery',
                                Category: 'Lean Ops',
                                Current_Module: 'Modul 3: Visual Management',
                                Progress_Pct: 100,
                                Study_Hours: 2.5,
                                Score: 95,
                                Certificate_Status: 'IN_PROGRESS',
                                Last_Active: 'CURRENT_TIMESTAMP'
                            }
                        }
                    ]
                },

                // SCREEN 5: MY COURSES / KURSUS AKTIF
                {
                    id: 'screen_my_courses',
                    title: 'My Courses — Ruang Belajar',
                    components: [
                        {
                            id: 'my_header',
                            type: 'Text',
                            props: { text: '📚 Kursus & Pelatihan Saya', size: 'lg', bold: true }
                        },
                        {
                            id: 'my_tabs',
                            type: 'Tabs',
                            props: {
                                tabs: ['Sedang Berjalan (3)', 'Telah Selesai (2)']
                            }
                        },
                        {
                            id: 'my_c1_title',
                            type: 'Text',
                            props: { text: 'Metodologi 5S & Lean Shopfloor', size: 'md', bold: true }
                        },
                        {
                            id: 'my_c1_prog',
                            type: 'Progress',
                            props: { value: 75, label: 'Progres: 75% (Modul 3 dari 4)' }
                        },
                        {
                            id: 'my_c1_btn',
                            type: 'Button',
                            props: { text: '▶ Lanjutkan Modul 4 (Ujian Evaluasi)', variant: 'primary', action: 'NEXT_SCREEN' }
                        },
                        {
                            id: 'my_c2_title',
                            type: 'Text',
                            props: { text: 'Pengukuran Presisi & Toleransi QC', size: 'md', bold: true }
                        },
                        {
                            id: 'my_c2_prog',
                            type: 'Progress',
                            props: { value: 40, label: 'Progres: 40% (Modul 5 dari 12)' }
                        },
                        {
                            id: 'my_c3_title',
                            type: 'Text',
                            props: { text: 'K3 Kebakaran & Tanggap Darurat Pabrik', size: 'md', bold: true }
                        },
                        {
                            id: 'my_c3_prog',
                            type: 'Progress',
                            props: { value: 90, label: 'Progres: 90% (Menunggu Praktik APAR)' }
                        },
                        {
                            id: 'my_nav_analytics',
                            type: 'Button',
                            props: { text: 'Lihat Analitik Belajar & Streak 🔥 ➔', variant: 'secondary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },

                // SCREEN 6: LEARNING PROGRESS, STREAK & ACHIEVEMENTS
                {
                    id: 'screen_progress_analytics',
                    title: 'Progress & Analytics',
                    components: [
                        {
                            id: 'pro_header',
                            type: 'Text',
                            props: { text: '📈 Analitik Belajar & Prestasi', size: 'lg', bold: true }
                        },
                        {
                            id: 'pro_streak_alert',
                            type: 'Alert',
                            props: {
                                title: '🔥 Streak Belajar: 7 Hari Berturut-turut!',
                                message: 'Luar biasa! Konsistensi belajar harian Anda berada di Top 5% operator seluruh pabrik.'
                            }
                        },
                        {
                            id: 'pro_kpi_target',
                            type: 'Progress',
                            props: { value: 83, label: 'Target Jam Belajar Mingguan: 12.5 / 15 Jam (83%)' }
                        },
                        {
                            id: 'pro_chart_hours',
                            type: 'Chart',
                            props: {
                                type: 'bar',
                                title: 'Jam Belajar per Hari (Minggu Ini)',
                                subtitle: 'Senin s/d Minggu',
                                unit: 'jam',
                                targetValue: 2.0,
                                data: [
                                    { label: 'Sen', value: 2.5 },
                                    { label: 'Sel', value: 1.8 },
                                    { label: 'Rab', value: 3.0 },
                                    { label: 'Kam', value: 2.2 },
                                    { label: 'Jum', value: 1.5 },
                                    { label: 'Sab', value: 1.5 },
                                    { label: 'Min', value: 0.0 }
                                ]
                            }
                        },
                        {
                            id: 'pro_badges_title',
                            type: 'Text',
                            props: { text: '🏅 Lencana & Pencapaian Kompetensi', size: 'md', bold: true }
                        },
                        {
                            id: 'pro_badge_1',
                            type: 'ListItem',
                            props: {
                                title: '🏆 Fast Learner',
                                subtitle: 'Menyelesaikan 3 modul pembelajaran dalam waktu 24 jam',
                                badge: 'TERBUKA',
                                value: 'Level 1'
                            }
                        },
                        {
                            id: 'pro_badge_2',
                            type: 'ListItem',
                            props: {
                                title: '🛡️ Safety First Champion',
                                subtitle: 'Mendapat nilai sempurna 100% pada ujian keselamatan K3',
                                badge: 'TERBUKA',
                                value: 'Level 2'
                            }
                        },
                        {
                            id: 'pro_badge_3',
                            type: 'ListItem',
                            props: {
                                title: '⚡ Zero Defect Mindset',
                                subtitle: 'Menyelesaikan seluruh kurikulum Quality Control ISO 9001',
                                badge: 'TERBUKA',
                                value: 'Level 3'
                            }
                        },
                        {
                            id: 'pro_badge_4',
                            type: 'ListItem',
                            props: {
                                title: '🎓 Green Belt Certified',
                                subtitle: 'Lulus asesmen praktis metodologi Lean & Kaizen shopfloor',
                                badge: 'KLAIM',
                                value: 'Spesialis'
                            }
                        },
                        {
                            id: 'pro_btn_profile',
                            type: 'Button',
                            props: { text: 'Buka Profil & Sertifikat Saya ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },

                // SCREEN 7: PROFILE & DIGITAL CERTIFICATE
                {
                    id: 'screen_profile_certs',
                    title: 'Operator Profile & Certificate',
                    components: [
                        {
                            id: 'prof_avatar',
                            type: 'Avatar',
                            props: { name: 'Budi Santoso' }
                        },
                        {
                            id: 'prof_name',
                            type: 'Text',
                            props: { text: 'Budi Santoso • Senior Assembly Tech', size: 'xl', bold: true }
                        },
                        {
                            id: 'prof_badge_tier',
                            type: 'Badge',
                            props: { text: 'GRADE 3 TECHNICIAN • PLANT 2', action: 'success' }
                        },
                        {
                            id: 'prof_stats_card',
                            type: 'Card',
                            props: {
                                title: '📊 Ringkasan Statistik',
                                content: '• Total Jam Belajar: 48.5 Jam\n• Modul Terselesaikan: 34 Modul\n• Sertifikat Aktif: 5 Sertifikat Resmi\n• Skor Rata-rata Ujian: 94 / 100'
                            }
                        },
                        {
                            id: 'prof_cert_title',
                            type: 'Text',
                            props: { text: '📜 Sertifikat Kompetensi Digital Resmi', size: 'md', bold: true }
                        },
                        {
                            id: 'prof_cert_pdf',
                            type: 'PDFViewer',
                            props: {
                                title: 'Sertifikat Kompetensi: Lean 5S & Kaizen Shopfloor',
                                docNo: 'CERT-LEAN-2026-0941',
                                rev: 'Resmi Mavi MES & BNSP',
                                pages: 1
                            }
                        },
                        {
                            id: 'prof_btn_download',
                            type: 'Button',
                            props: { text: '⬇️ Unduh Salinan Sertifikat (PDF)', variant: 'secondary' }
                        },
                        {
                            id: 'prof_btn_home',
                            type: 'Button',
                            props: { text: 'Kembali ke Katalog Kursus 🏠', variant: 'primary', action: 'FIRST_SCREEN' }
                        }
                    ],
                    triggers: []
                }
            ]
        }
    };
}
