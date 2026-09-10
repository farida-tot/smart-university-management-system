import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog';

@Component({
  selector: 'app-department-detail',
  imports: [RouterLink],
  templateUrl: './department-detail.html',
  styleUrl: './department-detail.css'
})
export class DepartmentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  department: any;
  error = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.catalog.getDepartment(id).subscribe({
        next: department => { this.department = department; this.changeDetector.markForCheck(); },
        error: error => { this.error = error.error?.message ?? 'Unable to load this department.'; this.changeDetector.markForCheck(); }
      });
    });
  }

  instructorNames(course: any) {
    return course.instructors?.map((instructor: any) => instructor.userId?.name || instructor.employeeNumber).join(', ') || 'To be announced';
  }
}
