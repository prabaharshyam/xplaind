-- RM-7 as amended: a learner can mark a stop done with one tap. It is stored as
-- 'self_marked', so analytics and badges can tell it apart from a passed check.
alter table stop_progress drop constraint if exists stop_progress_done_how_check;
alter table stop_progress add constraint stop_progress_done_how_check
  check (done_how in ('check','project','self_marked','self_skipped'));
