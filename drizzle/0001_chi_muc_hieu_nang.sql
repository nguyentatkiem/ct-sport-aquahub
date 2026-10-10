CREATE INDEX "ci_the_ngay_idx" ON "check_in" USING btree ("the_ve_id","ngay_vn");--> statement-breakpoint
CREATE INDEX "ci_vuot_idx" ON "check_in" USING btree ("vuot_chan_tu_id") WHERE "check_in"."vuot_chan_tu_id" is not null;--> statement-breakpoint
CREATE INDEX "dh_con_no_idx" ON "don_hang" USING btree ("con_no") WHERE "don_hang"."con_no" > 0;--> statement-breakpoint
CREATE INDEX "lhcb_the_tg_idx" ON "lien_he_canh_bao" USING btree ("the_ve_id","thoi_gian");--> statement-breakpoint
CREATE INDEX "pt_khach_idx" ON "phieu_thu" USING btree ("khach_hang_id");