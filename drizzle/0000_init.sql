CREATE TABLE "bo_dem" (
	"tien_to" text NOT NULL,
	"nam" integer NOT NULL,
	"gia_tri" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "bo_dem_tien_to_nam_pk" PRIMARY KEY("tien_to","nam")
);
--> statement-breakpoint
CREATE TABLE "cai_dat" (
	"khoa" text PRIMARY KEY NOT NULL,
	"gia_tri" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_in" (
	"id" serial PRIMARY KEY NOT NULL,
	"thoi_gian" timestamp with time zone DEFAULT now() NOT NULL,
	"ngay_vn" date NOT NULL,
	"khach_hang_id" integer NOT NULL,
	"the_ve_id" integer,
	"lop_hoc_id" integer,
	"ghi_danh_id" integer,
	"giao_vien_id" integer,
	"co_so_id" integer NOT NULL,
	"ma_qr_id" integer,
	"so_luot_con_sau" integer,
	"so_buoi_sau" integer,
	"ket_qua" text NOT NULL,
	"mau" text NOT NULL,
	"ly_do" text,
	"ly_do_text" text,
	"tru_luot" boolean DEFAULT false NOT NULL,
	"nguoi_thao_tac_id" integer,
	"vuot_chan_tu_id" integer,
	"kenh" text NOT NULL,
	"ma_xac_nhan" text NOT NULL,
	"loai_khach_trong_ngay" text,
	"canh_bao_sap_het" text
);
--> statement-breakpoint
CREATE TABLE "co_so" (
	"id" serial PRIMARY KEY NOT NULL,
	"ma" text NOT NULL,
	"ten" text NOT NULL,
	"dia_chi" text,
	"sdt" text,
	"cho_tu_dang_ky" boolean DEFAULT true NOT NULL,
	"trang_thai" text DEFAULT 'HOAT_DONG' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "co_so_ma_unique" UNIQUE("ma")
);
--> statement-breakpoint
CREATE TABLE "dieu_chinh" (
	"id" serial PRIMARY KEY NOT NULL,
	"the_ve_id" integer,
	"ghi_danh_id" integer,
	"loai" text NOT NULL,
	"so_luong" integer,
	"the_dich_id" integer,
	"gia_tri_cu" jsonb,
	"gia_tri_moi" jsonb,
	"ly_do" text NOT NULL,
	"nguoi_thuc_hien_id" integer,
	"thoi_gian" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "don_hang" (
	"id" serial PRIMARY KEY NOT NULL,
	"ma_don" text NOT NULL,
	"khach_hang_id" integer NOT NULL,
	"co_so_id" integer NOT NULL,
	"loai" text NOT NULL,
	"san_pham_id" integer NOT NULL,
	"ten_san_pham" text NOT NULL,
	"gia_niem_yet" bigint NOT NULL,
	"gia_thuc_thu" bigint NOT NULL,
	"ly_do_giam" text,
	"da_thu" bigint DEFAULT 0 NOT NULL,
	"con_no" bigint DEFAULT 0 NOT NULL,
	"trang_thai_tt" text NOT NULL,
	"khong_tinh_doanh_so" boolean DEFAULT false NOT NULL,
	"ngay_ban" date NOT NULL,
	"nguoi_tao_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "don_hang_ma_don_unique" UNIQUE("ma_don")
);
--> statement-breakpoint
CREATE TABLE "ghi_danh" (
	"id" serial PRIMARY KEY NOT NULL,
	"khach_hang_id" integer NOT NULL,
	"san_pham_id" integer NOT NULL,
	"don_hang_id" integer,
	"lop_hoc_id" integer NOT NULL,
	"giao_vien_id" integer,
	"co_so_id" integer NOT NULL,
	"ten_khoa_hoc" text NOT NULL,
	"ngay_ghi_danh" date NOT NULL,
	"so_buoi_hoc_goc" integer,
	"so_buoi_tot_nghiep" integer,
	"so_buoi_da_hoc" integer DEFAULT 0 NOT NULL,
	"cho_bao_luu" boolean DEFAULT false NOT NULL,
	"bao_luu_toi_da_ngay" integer,
	"bao_luu_tu" date,
	"bao_luu_den" date,
	"trang_thai" text DEFAULT 'DANG_HOC' NOT NULL,
	"ghi_chu" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "giao_vien" (
	"id" serial PRIMARY KEY NOT NULL,
	"ho_ten" text NOT NULL,
	"sdt" text,
	"trang_thai" text DEFAULT 'DANG_LAM' NOT NULL,
	"ghi_chu" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "giao_vien_co_so" (
	"giao_vien_id" integer NOT NULL,
	"co_so_id" integer NOT NULL,
	CONSTRAINT "giao_vien_co_so_giao_vien_id_co_so_id_pk" PRIMARY KEY("giao_vien_id","co_so_id")
);
--> statement-breakpoint
CREATE TABLE "gioi_han_tra_cuu" (
	"khoa" text NOT NULL,
	"phut" integer NOT NULL,
	"so_lan" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "khach_hang" (
	"id" serial PRIMARY KEY NOT NULL,
	"ma_kh" text NOT NULL,
	"ho_ten" text NOT NULL,
	"ngay_sinh" date NOT NULL,
	"sdt" text,
	"nguoi_lien_he_id" integer,
	"co_so_id" integer NOT NULL,
	"ngay_dang_ky" timestamp with time zone DEFAULT now() NOT NULL,
	"nguon_tao" text NOT NULL,
	"trang_thai" text NOT NULL,
	"ghi_chu" text,
	"ghi_chu_suc_khoe" text,
	"khoa_hoc_muon_dang_ky_id" integer,
	"qr_token" text NOT NULL,
	"dong_y_du_lieu_luc" timestamp with time zone,
	"tim_kiem" text DEFAULT '' NOT NULL,
	"gop_vao_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "khach_hang_ma_kh_unique" UNIQUE("ma_kh"),
	CONSTRAINT "khach_hang_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE "lien_he_canh_bao" (
	"id" serial PRIMARY KEY NOT NULL,
	"the_ve_id" integer NOT NULL,
	"khach_hang_id" integer NOT NULL,
	"nguoi_goi_id" integer,
	"ket_qua" text NOT NULL,
	"ghi_chu" text,
	"thoi_gian" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lop_hoc" (
	"id" serial PRIMARY KEY NOT NULL,
	"ten" text NOT NULL,
	"co_so_id" integer NOT NULL,
	"san_pham_id" integer NOT NULL,
	"giao_vien_id" integer,
	"lich_text" text,
	"trang_thai" text DEFAULT 'DANG_HOC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ma_qr" (
	"id" serial PRIMARY KEY NOT NULL,
	"loai" text NOT NULL,
	"ten" text NOT NULL,
	"co_so_id" integer NOT NULL,
	"lop_hoc_id" integer,
	"token" text NOT NULL,
	"trang_thai" text DEFAULT 'HIEU_LUC' NOT NULL,
	"thay_the_boi_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ma_qr_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "nguoi_dung" (
	"id" serial PRIMARY KEY NOT NULL,
	"ho_ten" text NOT NULL,
	"sdt" text,
	"email" text,
	"mat_khau_hash" text NOT NULL,
	"vai_tro" text NOT NULL,
	"co_so_id" integer,
	"trang_thai" text DEFAULT 'HOAT_DONG' NOT NULL,
	"so_lan_sai" integer DEFAULT 0 NOT NULL,
	"khoa_den" timestamp with time zone,
	"phien_ban" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nguoi_dung_sdt_unique" UNIQUE("sdt"),
	CONSTRAINT "nguoi_dung_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "nguoi_lien_he" (
	"id" serial PRIMARY KEY NOT NULL,
	"ho_ten" text NOT NULL,
	"sdt" text NOT NULL,
	"quan_he" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhat_ky" (
	"id" serial PRIMARY KEY NOT NULL,
	"thoi_gian" timestamp with time zone DEFAULT now() NOT NULL,
	"nguoi_dung_id" integer,
	"ten_nguoi_dung" text,
	"vai_tro" text,
	"co_so_id" integer,
	"module" text NOT NULL,
	"hanh_dong" text NOT NULL,
	"doi_tuong" text,
	"gia_tri_cu" jsonb,
	"gia_tri_moi" jsonb,
	"ly_do" text,
	"ip" text,
	"thiet_bi" text
);
--> statement-breakpoint
CREATE TABLE "phieu_thu" (
	"id" serial PRIMARY KEY NOT NULL,
	"ma_phieu" text NOT NULL,
	"don_hang_id" integer NOT NULL,
	"khach_hang_id" integer NOT NULL,
	"co_so_id" integer NOT NULL,
	"loai" text NOT NULL,
	"so_tien" bigint NOT NULL,
	"hinh_thuc" text NOT NULL,
	"thoi_gian" timestamp with time zone DEFAULT now() NOT NULL,
	"ngay_vn" date NOT NULL,
	"nguoi_thu_id" integer,
	"ghi_chu" text,
	"trang_thai" text DEFAULT 'HIEU_LUC' NOT NULL,
	"ly_do_huy" text,
	"nguoi_huy_id" integer,
	"huy_luc" timestamp with time zone,
	CONSTRAINT "phieu_thu_ma_phieu_unique" UNIQUE("ma_phieu")
);
--> statement-breakpoint
CREATE TABLE "san_pham" (
	"id" serial PRIMARY KEY NOT NULL,
	"loai" text NOT NULL,
	"ten" text NOT NULL,
	"ten_en" text,
	"gia_niem_yet" bigint NOT NULL,
	"co_so_ap_dung" integer[],
	"trang_thai" text DEFAULT 'DANG_BAN' NOT NULL,
	"so_luot" integer,
	"han_dung_ngay" integer,
	"moc_tinh_han" text DEFAULT 'NGAY_MUA' NOT NULL,
	"luat_chan" text DEFAULT 'HET_LUOT_HOAC_HET_HAN' NOT NULL,
	"hanh_dong_khi_vi_pham" text DEFAULT 'CHAN' NOT NULL,
	"dung_lien_co_so" boolean DEFAULT false NOT NULL,
	"toi_da_luot_moi_ngay" integer DEFAULT 1 NOT NULL,
	"nguong_canh_bao_luot" integer DEFAULT 3 NOT NULL,
	"nguong_canh_bao_ngay" integer DEFAULT 7 NOT NULL,
	"la_the_chuyen_doi" boolean DEFAULT false NOT NULL,
	"cho_bao_luu" boolean DEFAULT false NOT NULL,
	"bao_luu_toi_da_ngay" integer,
	"so_buoi_hoc" integer,
	"so_buoi_tot_nghiep" integer,
	"the_ve_kem_theo_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "the_ve" (
	"id" serial PRIMARY KEY NOT NULL,
	"ma_the" text NOT NULL,
	"khach_hang_id" integer NOT NULL,
	"san_pham_id" integer NOT NULL,
	"don_hang_id" integer,
	"co_so_ban_id" integer NOT NULL,
	"ten_san_pham" text NOT NULL,
	"ten_san_pham_en" text,
	"so_luot_goc" integer,
	"so_luot_con_lai" integer,
	"so_luot_da_dung" integer DEFAULT 0 NOT NULL,
	"han_dung_ngay" integer,
	"moc_tinh_han" text NOT NULL,
	"luat_chan" text NOT NULL,
	"hanh_dong_khi_vi_pham" text NOT NULL,
	"dung_lien_co_so" boolean NOT NULL,
	"co_so_ap_dung" integer[],
	"toi_da_luot_moi_ngay" integer NOT NULL,
	"nguong_canh_bao_luot" integer NOT NULL,
	"nguong_canh_bao_ngay" integer NOT NULL,
	"cho_bao_luu" boolean NOT NULL,
	"bao_luu_toi_da_ngay" integer,
	"la_chuyen_doi" boolean DEFAULT false NOT NULL,
	"ngay_mua" date NOT NULL,
	"ngay_kich_hoat" date,
	"ngay_het_han" date,
	"so_ngay_da_bao_luu" integer DEFAULT 0 NOT NULL,
	"bao_luu_tu" date,
	"bao_luu_den" date,
	"trang_thai" text DEFAULT 'HOAT_DONG' NOT NULL,
	"anh_the_giay" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "the_ve_ma_the_unique" UNIQUE("ma_the")
);
--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_khach_hang_id_khach_hang_id_fk" FOREIGN KEY ("khach_hang_id") REFERENCES "public"."khach_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_the_ve_id_the_ve_id_fk" FOREIGN KEY ("the_ve_id") REFERENCES "public"."the_ve"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_lop_hoc_id_lop_hoc_id_fk" FOREIGN KEY ("lop_hoc_id") REFERENCES "public"."lop_hoc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_ghi_danh_id_ghi_danh_id_fk" FOREIGN KEY ("ghi_danh_id") REFERENCES "public"."ghi_danh"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_giao_vien_id_giao_vien_id_fk" FOREIGN KEY ("giao_vien_id") REFERENCES "public"."giao_vien"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_nguoi_thao_tac_id_nguoi_dung_id_fk" FOREIGN KEY ("nguoi_thao_tac_id") REFERENCES "public"."nguoi_dung"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dieu_chinh" ADD CONSTRAINT "dieu_chinh_the_ve_id_the_ve_id_fk" FOREIGN KEY ("the_ve_id") REFERENCES "public"."the_ve"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dieu_chinh" ADD CONSTRAINT "dieu_chinh_ghi_danh_id_ghi_danh_id_fk" FOREIGN KEY ("ghi_danh_id") REFERENCES "public"."ghi_danh"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dieu_chinh" ADD CONSTRAINT "dieu_chinh_nguoi_thuc_hien_id_nguoi_dung_id_fk" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "public"."nguoi_dung"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_khach_hang_id_khach_hang_id_fk" FOREIGN KEY ("khach_hang_id") REFERENCES "public"."khach_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_san_pham_id_san_pham_id_fk" FOREIGN KEY ("san_pham_id") REFERENCES "public"."san_pham"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "don_hang" ADD CONSTRAINT "don_hang_nguoi_tao_id_nguoi_dung_id_fk" FOREIGN KEY ("nguoi_tao_id") REFERENCES "public"."nguoi_dung"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ghi_danh" ADD CONSTRAINT "ghi_danh_khach_hang_id_khach_hang_id_fk" FOREIGN KEY ("khach_hang_id") REFERENCES "public"."khach_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ghi_danh" ADD CONSTRAINT "ghi_danh_san_pham_id_san_pham_id_fk" FOREIGN KEY ("san_pham_id") REFERENCES "public"."san_pham"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ghi_danh" ADD CONSTRAINT "ghi_danh_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ghi_danh" ADD CONSTRAINT "ghi_danh_lop_hoc_id_lop_hoc_id_fk" FOREIGN KEY ("lop_hoc_id") REFERENCES "public"."lop_hoc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ghi_danh" ADD CONSTRAINT "ghi_danh_giao_vien_id_giao_vien_id_fk" FOREIGN KEY ("giao_vien_id") REFERENCES "public"."giao_vien"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ghi_danh" ADD CONSTRAINT "ghi_danh_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giao_vien_co_so" ADD CONSTRAINT "giao_vien_co_so_giao_vien_id_giao_vien_id_fk" FOREIGN KEY ("giao_vien_id") REFERENCES "public"."giao_vien"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giao_vien_co_so" ADD CONSTRAINT "giao_vien_co_so_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "khach_hang" ADD CONSTRAINT "khach_hang_nguoi_lien_he_id_nguoi_lien_he_id_fk" FOREIGN KEY ("nguoi_lien_he_id") REFERENCES "public"."nguoi_lien_he"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "khach_hang" ADD CONSTRAINT "khach_hang_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lien_he_canh_bao" ADD CONSTRAINT "lien_he_canh_bao_the_ve_id_the_ve_id_fk" FOREIGN KEY ("the_ve_id") REFERENCES "public"."the_ve"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lien_he_canh_bao" ADD CONSTRAINT "lien_he_canh_bao_khach_hang_id_khach_hang_id_fk" FOREIGN KEY ("khach_hang_id") REFERENCES "public"."khach_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lien_he_canh_bao" ADD CONSTRAINT "lien_he_canh_bao_nguoi_goi_id_nguoi_dung_id_fk" FOREIGN KEY ("nguoi_goi_id") REFERENCES "public"."nguoi_dung"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lop_hoc" ADD CONSTRAINT "lop_hoc_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lop_hoc" ADD CONSTRAINT "lop_hoc_san_pham_id_san_pham_id_fk" FOREIGN KEY ("san_pham_id") REFERENCES "public"."san_pham"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lop_hoc" ADD CONSTRAINT "lop_hoc_giao_vien_id_giao_vien_id_fk" FOREIGN KEY ("giao_vien_id") REFERENCES "public"."giao_vien"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ma_qr" ADD CONSTRAINT "ma_qr_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ma_qr" ADD CONSTRAINT "ma_qr_lop_hoc_id_lop_hoc_id_fk" FOREIGN KEY ("lop_hoc_id") REFERENCES "public"."lop_hoc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nguoi_dung" ADD CONSTRAINT "nguoi_dung_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phieu_thu" ADD CONSTRAINT "phieu_thu_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phieu_thu" ADD CONSTRAINT "phieu_thu_khach_hang_id_khach_hang_id_fk" FOREIGN KEY ("khach_hang_id") REFERENCES "public"."khach_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phieu_thu" ADD CONSTRAINT "phieu_thu_co_so_id_co_so_id_fk" FOREIGN KEY ("co_so_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phieu_thu" ADD CONSTRAINT "phieu_thu_nguoi_thu_id_nguoi_dung_id_fk" FOREIGN KEY ("nguoi_thu_id") REFERENCES "public"."nguoi_dung"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "the_ve" ADD CONSTRAINT "the_ve_khach_hang_id_khach_hang_id_fk" FOREIGN KEY ("khach_hang_id") REFERENCES "public"."khach_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "the_ve" ADD CONSTRAINT "the_ve_san_pham_id_san_pham_id_fk" FOREIGN KEY ("san_pham_id") REFERENCES "public"."san_pham"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "the_ve" ADD CONSTRAINT "the_ve_don_hang_id_don_hang_id_fk" FOREIGN KEY ("don_hang_id") REFERENCES "public"."don_hang"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "the_ve" ADD CONSTRAINT "the_ve_co_so_ban_id_co_so_id_fk" FOREIGN KEY ("co_so_ban_id") REFERENCES "public"."co_so"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ci_co_so_tg_idx" ON "check_in" USING btree ("co_so_id","thoi_gian");--> statement-breakpoint
CREATE INDEX "ci_khach_tg_idx" ON "check_in" USING btree ("khach_hang_id","thoi_gian");--> statement-breakpoint
CREATE INDEX "ci_ngay_idx" ON "check_in" USING btree ("ngay_vn");--> statement-breakpoint
CREATE INDEX "dh_co_so_ngay_idx" ON "don_hang" USING btree ("co_so_id","ngay_ban");--> statement-breakpoint
CREATE INDEX "dh_khach_idx" ON "don_hang" USING btree ("khach_hang_id");--> statement-breakpoint
CREATE INDEX "gd_khach_idx" ON "ghi_danh" USING btree ("khach_hang_id");--> statement-breakpoint
CREATE INDEX "gd_lop_idx" ON "ghi_danh" USING btree ("lop_hoc_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ghtc_khoa_phut" ON "gioi_han_tra_cuu" USING btree ("khoa","phut");--> statement-breakpoint
CREATE INDEX "kh_sdt_idx" ON "khach_hang" USING btree ("sdt");--> statement-breakpoint
CREATE INDEX "kh_co_so_idx" ON "khach_hang" USING btree ("co_so_id");--> statement-breakpoint
CREATE INDEX "kh_lien_he_idx" ON "khach_hang" USING btree ("nguoi_lien_he_id");--> statement-breakpoint
CREATE INDEX "nlh_sdt_idx" ON "nguoi_lien_he" USING btree ("sdt");--> statement-breakpoint
CREATE INDEX "nk_tg_idx" ON "nhat_ky" USING btree ("thoi_gian");--> statement-breakpoint
CREATE INDEX "pt_co_so_ngay_idx" ON "phieu_thu" USING btree ("co_so_id","ngay_vn");--> statement-breakpoint
CREATE INDEX "pt_don_idx" ON "phieu_thu" USING btree ("don_hang_id");--> statement-breakpoint
CREATE INDEX "tv_khach_idx" ON "the_ve" USING btree ("khach_hang_id");