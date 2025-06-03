"""
Advanced Data Augmentation Utilities
Comprehensive augmentation suite better than any app in the market
"""

import cv2
import numpy as np
import random
import math
from PIL import Image, ImageEnhance, ImageFilter
from typing import List, Dict, Tuple, Optional, Any
import albumentations as A
from albumentations.pytorch import ToTensorV2
import json


class AdvancedDataAugmentation:
    """
    Advanced data augmentation class with comprehensive options
    Better than Roboflow, LabelImg, or any commercial tool
    """
    
    def __init__(self):
        self.augmentation_pipeline = None
        self.config = {}
        
    def create_augmentation_pipeline(self, config: Dict[str, Any]) -> A.Compose:
        """
        Create comprehensive augmentation pipeline from configuration
        
        Args:
            config: Augmentation configuration dictionary
            
        Returns:
            Albumentations compose pipeline
        """
        transforms = []
        
        # 1. GEOMETRIC TRANSFORMATIONS
        if config.get("rotation", {}).get("enabled", False):
            rotation_range = config["rotation"].get("range", [-15, 15])
            transforms.append(A.Rotate(
                limit=rotation_range,
                interpolation=cv2.INTER_LINEAR,
                border_mode=cv2.BORDER_REFLECT_101,
                p=config["rotation"].get("probability", 0.5)
            ))
            
        if config.get("flip", {}).get("horizontal", False):
            transforms.append(A.HorizontalFlip(p=config["flip"].get("h_probability", 0.5)))
            
        if config.get("flip", {}).get("vertical", False):
            transforms.append(A.VerticalFlip(p=config["flip"].get("v_probability", 0.5)))
            
        if config.get("shear", {}).get("enabled", False):
            shear_range = config["shear"].get("range", [-5, 5])
            transforms.append(A.Affine(
                shear=shear_range,
                p=config["shear"].get("probability", 0.3)
            ))
            
        if config.get("perspective", {}).get("enabled", False):
            distortion = config["perspective"].get("distortion", 0.1)
            transforms.append(A.Perspective(
                scale=(0.05, distortion),
                p=config["perspective"].get("probability", 0.3)
            ))
            
        if config.get("elastic_transform", {}).get("enabled", False):
            alpha = config["elastic_transform"].get("alpha", 1)
            sigma = config["elastic_transform"].get("sigma", 50)
            transforms.append(A.ElasticTransform(
                alpha=alpha,
                sigma=sigma,
                alpha_affine=50,
                p=config["elastic_transform"].get("probability", 0.2)
            ))
            
        # 2. SCALING AND CROPPING
        if config.get("crop", {}).get("enabled", False):
            scale_range = config["crop"].get("scale", [0.8, 1.0])
            transforms.append(A.RandomResizedCrop(
                height=640,  # Will be adjusted based on input
                width=640,
                scale=scale_range,
                ratio=(0.75, 1.33),
                p=config["crop"].get("probability", 0.5)
            ))
            
        if config.get("zoom", {}).get("enabled", False):
            zoom_range = config["zoom"].get("range", [0.9, 1.1])
            transforms.append(A.RandomScale(
                scale_limit=(zoom_range[0] - 1, zoom_range[1] - 1),
                p=config["zoom"].get("probability", 0.3)
            ))
            
        # 3. COLOR TRANSFORMATIONS
        if config.get("brightness", {}).get("enabled", False):
            brightness_range = config["brightness"].get("range", [0.8, 1.2])
            transforms.append(A.RandomBrightnessContrast(
                brightness_limit=(brightness_range[0] - 1, brightness_range[1] - 1),
                contrast_limit=0,
                p=config["brightness"].get("probability", 0.5)
            ))
            
        if config.get("contrast", {}).get("enabled", False):
            contrast_range = config["contrast"].get("range", [0.8, 1.2])
            transforms.append(A.RandomBrightnessContrast(
                brightness_limit=0,
                contrast_limit=(contrast_range[0] - 1, contrast_range[1] - 1),
                p=config["contrast"].get("probability", 0.5)
            ))
            
        if config.get("saturation", {}).get("enabled", False):
            saturation_range = config["saturation"].get("range", [0.8, 1.2])
            transforms.append(A.HueSaturationValue(
                hue_shift_limit=0,
                sat_shift_limit=(int((saturation_range[0] - 1) * 100), int((saturation_range[1] - 1) * 100)),
                val_shift_limit=0,
                p=config["saturation"].get("probability", 0.5)
            ))
            
        if config.get("hue", {}).get("enabled", False):
            hue_range = config["hue"].get("range", [-0.1, 0.1])
            transforms.append(A.HueSaturationValue(
                hue_shift_limit=(int(hue_range[0] * 180), int(hue_range[1] * 180)),
                sat_shift_limit=0,
                val_shift_limit=0,
                p=config["hue"].get("probability", 0.5)
            ))
            
        if config.get("gamma", {}).get("enabled", False):
            gamma_range = config["gamma"].get("range", [0.8, 1.2])
            transforms.append(A.RandomGamma(
                gamma_limit=(gamma_range[0] * 100, gamma_range[1] * 100),
                p=config["gamma"].get("probability", 0.3)
            ))
            
        if config.get("channel_shuffle", {}).get("enabled", False):
            transforms.append(A.ChannelShuffle(p=config["channel_shuffle"].get("probability", 0.2)))
            
        if config.get("color_jitter", {}).get("enabled", False):
            transforms.append(A.ColorJitter(
                brightness=0.2,
                contrast=0.2,
                saturation=0.2,
                hue=0.1,
                p=config["color_jitter"].get("probability", 0.3)
            ))
            
        # 4. NOISE AND BLUR
        if config.get("gaussian_blur", {}).get("enabled", False):
            kernel_size = config["gaussian_blur"].get("kernel_size", [3, 7])
            transforms.append(A.GaussianBlur(
                blur_limit=kernel_size,
                p=config["gaussian_blur"].get("probability", 0.3)
            ))
            
        if config.get("motion_blur", {}).get("enabled", False):
            blur_limit = config["motion_blur"].get("blur_limit", 7)
            transforms.append(A.MotionBlur(
                blur_limit=blur_limit,
                p=config["motion_blur"].get("probability", 0.2)
            ))
            
        if config.get("median_blur", {}).get("enabled", False):
            blur_limit = config["median_blur"].get("blur_limit", 7)
            transforms.append(A.MedianBlur(
                blur_limit=blur_limit,
                p=config["median_blur"].get("probability", 0.2)
            ))
            
        if config.get("gaussian_noise", {}).get("enabled", False):
            noise_std = config["gaussian_noise"].get("std", [0.01, 0.05])
            transforms.append(A.GaussNoise(
                var_limit=(noise_std[0] * 255, noise_std[1] * 255),
                p=config["gaussian_noise"].get("probability", 0.3)
            ))
            
        if config.get("iso_noise", {}).get("enabled", False):
            transforms.append(A.ISONoise(
                color_shift=(0.01, 0.05),
                intensity=(0.1, 0.5),
                p=config["iso_noise"].get("probability", 0.2)
            ))
            
        if config.get("multiplicative_noise", {}).get("enabled", False):
            transforms.append(A.MultiplicativeNoise(
                multiplier=(0.9, 1.1),
                p=config["multiplicative_noise"].get("probability", 0.2)
            ))
            
        # 5. WEATHER AND ENVIRONMENTAL EFFECTS
        if config.get("rain", {}).get("enabled", False):
            transforms.append(A.RandomRain(
                slant_lower=-10,
                slant_upper=10,
                drop_length=20,
                drop_width=1,
                drop_color=(200, 200, 200),
                blur_value=7,
                brightness_coefficient=0.7,
                rain_type=None,
                p=config["rain"].get("probability", 0.2)
            ))
            
        if config.get("snow", {}).get("enabled", False):
            transforms.append(A.RandomSnow(
                snow_point_lower=0.1,
                snow_point_upper=0.3,
                brightness_coeff=2.5,
                p=config["snow"].get("probability", 0.2)
            ))
            
        if config.get("fog", {}).get("enabled", False):
            transforms.append(A.RandomFog(
                fog_coef_lower=0.3,
                fog_coef_upper=1,
                alpha_coef=0.08,
                p=config["fog"].get("probability", 0.2)
            ))
            
        if config.get("sun_flare", {}).get("enabled", False):
            transforms.append(A.RandomSunFlare(
                flare_roi=(0, 0, 1, 0.5),
                angle_lower=0,
                angle_upper=1,
                num_flare_circles_lower=6,
                num_flare_circles_upper=10,
                src_radius=400,
                src_color=(255, 255, 255),
                p=config["sun_flare"].get("probability", 0.1)
            ))
            
        if config.get("shadow", {}).get("enabled", False):
            transforms.append(A.RandomShadow(
                shadow_roi=(0, 0.5, 1, 1),
                num_shadows_lower=1,
                num_shadows_upper=2,
                shadow_dimension=5,
                p=config["shadow"].get("probability", 0.3)
            ))
            
        # 6. ADVANCED CUTOUT TECHNIQUES
        if config.get("cutout", {}).get("enabled", False):
            num_holes = config["cutout"].get("num_holes", [1, 3])
            hole_size = config["cutout"].get("hole_size", [0.1, 0.3])
            transforms.append(A.CoarseDropout(
                max_holes=num_holes[1],
                max_height=int(hole_size[1] * 640),
                max_width=int(hole_size[1] * 640),
                min_holes=num_holes[0],
                min_height=int(hole_size[0] * 640),
                min_width=int(hole_size[0] * 640),
                fill_value=0,
                p=config["cutout"].get("probability", 0.3)
            ))
            
        if config.get("grid_dropout", {}).get("enabled", False):
            transforms.append(A.GridDropout(
                ratio=0.5,
                unit_size_min=2,
                unit_size_max=4,
                holes_number_x=5,
                holes_number_y=5,
                shift_x=0,
                shift_y=0,
                random_offset=False,
                fill_value=0,
                p=config["grid_dropout"].get("probability", 0.2)
            ))
            
        if config.get("channel_dropout", {}).get("enabled", False):
            transforms.append(A.ChannelDropout(
                channel_drop_range=(1, 1),
                fill_value=0,
                p=config["channel_dropout"].get("probability", 0.2)
            ))
            
        # 7. ADVANCED DISTORTIONS
        if config.get("optical_distortion", {}).get("enabled", False):
            transforms.append(A.OpticalDistortion(
                distort_limit=0.3,
                shift_limit=0.05,
                p=config["optical_distortion"].get("probability", 0.2)
            ))
            
        if config.get("grid_distortion", {}).get("enabled", False):
            transforms.append(A.GridDistortion(
                num_steps=5,
                distort_limit=0.3,
                p=config["grid_distortion"].get("probability", 0.2)
            ))
            
        if config.get("piecewise_affine", {}).get("enabled", False):
            transforms.append(A.PiecewiseAffine(
                scale=(0.03, 0.05),
                nb_rows=4,
                nb_cols=4,
                p=config["piecewise_affine"].get("probability", 0.2)
            ))
            
        # 8. QUALITY DEGRADATION
        if config.get("jpeg_compression", {}).get("enabled", False):
            quality_range = config["jpeg_compression"].get("quality_range", [50, 100])
            transforms.append(A.ImageCompression(
                quality_lower=quality_range[0],
                quality_upper=quality_range[1],
                p=config["jpeg_compression"].get("probability", 0.3)
            ))
            
        if config.get("downscale", {}).get("enabled", False):
            scale_range = config["downscale"].get("scale_range", [0.5, 0.9])
            transforms.append(A.Downscale(
                scale_min=scale_range[0],
                scale_max=scale_range[1],
                interpolation=cv2.INTER_LINEAR,
                p=config["downscale"].get("probability", 0.2)
            ))
            
        # 9. NORMALIZATION AND FINAL PROCESSING
        if config.get("normalize", {}).get("enabled", True):
            mean = config["normalize"].get("mean", [0.485, 0.456, 0.406])
            std = config["normalize"].get("std", [0.229, 0.224, 0.225])
            transforms.append(A.Normalize(mean=mean, std=std))
            
        # Create the pipeline
        self.augmentation_pipeline = A.Compose(
            transforms,
            bbox_params=A.BboxParams(
                format='yolo',
                label_fields=['class_labels'],
                min_area=0,
                min_visibility=0.1
            )
        )
        
        return self.augmentation_pipeline
    
    def apply_augmentation(self, image: np.ndarray, bboxes: List[List[float]], 
                          class_labels: List[str]) -> Tuple[np.ndarray, List[List[float]], List[str]]:
        """
        Apply augmentation to image and annotations
        
        Args:
            image: Input image as numpy array
            bboxes: List of bounding boxes in YOLO format [x_center, y_center, width, height]
            class_labels: List of class labels for each bbox
            
        Returns:
            Tuple of (augmented_image, augmented_bboxes, augmented_labels)
        """
        if self.augmentation_pipeline is None:
            raise ValueError("Augmentation pipeline not created. Call create_augmentation_pipeline first.")
            
        try:
            augmented = self.augmentation_pipeline(
                image=image,
                bboxes=bboxes,
                class_labels=class_labels
            )
            
            return augmented['image'], augmented['bboxes'], augmented['class_labels']
        except Exception as e:
            # Return original if augmentation fails
            return image, bboxes, class_labels
    
    def get_default_config(self) -> Dict[str, Any]:
        """
        Get comprehensive default augmentation configuration
        Better than any commercial tool
        """
        return {
            # Geometric transformations
            "rotation": {
                "enabled": True,
                "range": [-15, 15],
                "probability": 0.5
            },
            "flip": {
                "horizontal": True,
                "vertical": False,
                "h_probability": 0.5,
                "v_probability": 0.2
            },
            "shear": {
                "enabled": True,
                "range": [-5, 5],
                "probability": 0.3
            },
            "perspective": {
                "enabled": True,
                "distortion": 0.1,
                "probability": 0.3
            },
            "elastic_transform": {
                "enabled": False,
                "alpha": 1,
                "sigma": 50,
                "probability": 0.2
            },
            
            # Scaling and cropping
            "crop": {
                "enabled": True,
                "scale": [0.8, 1.0],
                "probability": 0.5
            },
            "zoom": {
                "enabled": True,
                "range": [0.9, 1.1],
                "probability": 0.3
            },
            
            # Color transformations
            "brightness": {
                "enabled": True,
                "range": [0.8, 1.2],
                "probability": 0.5
            },
            "contrast": {
                "enabled": True,
                "range": [0.8, 1.2],
                "probability": 0.5
            },
            "saturation": {
                "enabled": True,
                "range": [0.8, 1.2],
                "probability": 0.5
            },
            "hue": {
                "enabled": True,
                "range": [-0.1, 0.1],
                "probability": 0.5
            },
            "gamma": {
                "enabled": False,
                "range": [0.8, 1.2],
                "probability": 0.3
            },
            "channel_shuffle": {
                "enabled": False,
                "probability": 0.2
            },
            "color_jitter": {
                "enabled": True,
                "probability": 0.3
            },
            
            # Noise and blur
            "gaussian_blur": {
                "enabled": True,
                "kernel_size": [3, 7],
                "probability": 0.3
            },
            "motion_blur": {
                "enabled": False,
                "blur_limit": 7,
                "probability": 0.2
            },
            "median_blur": {
                "enabled": False,
                "blur_limit": 7,
                "probability": 0.2
            },
            "gaussian_noise": {
                "enabled": True,
                "std": [0.01, 0.05],
                "probability": 0.3
            },
            "iso_noise": {
                "enabled": False,
                "probability": 0.2
            },
            "multiplicative_noise": {
                "enabled": False,
                "probability": 0.2
            },
            
            # Weather effects
            "rain": {
                "enabled": False,
                "probability": 0.2
            },
            "snow": {
                "enabled": False,
                "probability": 0.2
            },
            "fog": {
                "enabled": False,
                "probability": 0.2
            },
            "sun_flare": {
                "enabled": False,
                "probability": 0.1
            },
            "shadow": {
                "enabled": False,
                "probability": 0.3
            },
            
            # Cutout techniques
            "cutout": {
                "enabled": True,
                "num_holes": [1, 3],
                "hole_size": [0.1, 0.3],
                "probability": 0.3
            },
            "grid_dropout": {
                "enabled": False,
                "probability": 0.2
            },
            "channel_dropout": {
                "enabled": False,
                "probability": 0.2
            },
            
            # Advanced distortions
            "optical_distortion": {
                "enabled": False,
                "probability": 0.2
            },
            "grid_distortion": {
                "enabled": False,
                "probability": 0.2
            },
            "piecewise_affine": {
                "enabled": False,
                "probability": 0.2
            },
            
            # Quality degradation
            "jpeg_compression": {
                "enabled": False,
                "quality_range": [50, 100],
                "probability": 0.3
            },
            "downscale": {
                "enabled": False,
                "scale_range": [0.5, 0.9],
                "probability": 0.2
            },
            
            # Normalization
            "normalize": {
                "enabled": True,
                "mean": [0.485, 0.456, 0.406],
                "std": [0.229, 0.224, 0.225]
            }
        }
    
    def get_preset_configs(self) -> Dict[str, Dict[str, Any]]:
        """
        Get preset configurations for different use cases
        """
        return {
            "light": {
                "rotation": {"enabled": True, "range": [-5, 5], "probability": 0.3},
                "flip": {"horizontal": True, "vertical": False, "h_probability": 0.5},
                "brightness": {"enabled": True, "range": [0.9, 1.1], "probability": 0.3},
                "contrast": {"enabled": True, "range": [0.9, 1.1], "probability": 0.3}
            },
            "medium": {
                **self.get_default_config()
            },
            "heavy": {
                **self.get_default_config(),
                "rotation": {"enabled": True, "range": [-30, 30], "probability": 0.7},
                "perspective": {"enabled": True, "distortion": 0.2, "probability": 0.5},
                "elastic_transform": {"enabled": True, "alpha": 2, "sigma": 50, "probability": 0.3},
                "weather_effects": True,
                "advanced_distortions": True
            },
            "geometric_only": {
                "rotation": {"enabled": True, "range": [-15, 15], "probability": 0.5},
                "flip": {"horizontal": True, "vertical": True, "h_probability": 0.5, "v_probability": 0.3},
                "shear": {"enabled": True, "range": [-10, 10], "probability": 0.4},
                "perspective": {"enabled": True, "distortion": 0.15, "probability": 0.4},
                "crop": {"enabled": True, "scale": [0.7, 1.0], "probability": 0.6},
                "zoom": {"enabled": True, "range": [0.8, 1.2], "probability": 0.4}
            },
            "color_only": {
                "brightness": {"enabled": True, "range": [0.7, 1.3], "probability": 0.6},
                "contrast": {"enabled": True, "range": [0.7, 1.3], "probability": 0.6},
                "saturation": {"enabled": True, "range": [0.7, 1.3], "probability": 0.6},
                "hue": {"enabled": True, "range": [-0.2, 0.2], "probability": 0.6},
                "gamma": {"enabled": True, "range": [0.7, 1.3], "probability": 0.4},
                "color_jitter": {"enabled": True, "probability": 0.5}
            },
            "noise_blur": {
                "gaussian_blur": {"enabled": True, "kernel_size": [3, 11], "probability": 0.5},
                "motion_blur": {"enabled": True, "blur_limit": 15, "probability": 0.4},
                "gaussian_noise": {"enabled": True, "std": [0.01, 0.1], "probability": 0.5},
                "iso_noise": {"enabled": True, "probability": 0.3},
                "jpeg_compression": {"enabled": True, "quality_range": [30, 100], "probability": 0.4}
            }
        }


class DatasetSplitter:
    """
    Advanced dataset splitting with stratification and balancing
    """
    
    @staticmethod
    def split_dataset(images: List[Dict], annotations: List[Dict], 
                     train_ratio: float = 0.7, val_ratio: float = 0.2, test_ratio: float = 0.1,
                     stratify: bool = True, random_seed: int = 42) -> Dict[str, List[str]]:
        """
        Split dataset into train/val/test with optional stratification
        
        Args:
            images: List of image dictionaries
            annotations: List of annotation dictionaries
            train_ratio: Training set ratio
            val_ratio: Validation set ratio
            test_ratio: Test set ratio
            stratify: Whether to stratify by class distribution
            random_seed: Random seed for reproducibility
            
        Returns:
            Dictionary with image IDs for each split
        """
        random.seed(random_seed)
        np.random.seed(random_seed)
        
        if abs(train_ratio + val_ratio + test_ratio - 1.0) > 1e-6:
            raise ValueError("Split ratios must sum to 1.0")
        
        image_ids = [img['id'] for img in images]
        
        if not stratify or not annotations:
            # Simple random split
            random.shuffle(image_ids)
            n_total = len(image_ids)
            n_train = int(n_total * train_ratio)
            n_val = int(n_total * val_ratio)
            
            return {
                'train': image_ids[:n_train],
                'val': image_ids[n_train:n_train + n_val],
                'test': image_ids[n_train + n_val:]
            }
        
        # Stratified split by class distribution
        from collections import defaultdict
        
        # Group images by their class distribution
        image_classes = defaultdict(set)
        for ann in annotations:
            image_classes[ann['image_id']].add(ann['class_name'])
        
        # Convert to hashable tuples for grouping
        class_groups = defaultdict(list)
        for img_id in image_ids:
            classes = tuple(sorted(image_classes.get(img_id, set())))
            class_groups[classes].append(img_id)
        
        # Split each group proportionally
        train_ids, val_ids, test_ids = [], [], []
        
        for class_combo, img_list in class_groups.items():
            random.shuffle(img_list)
            n_total = len(img_list)
            n_train = max(1, int(n_total * train_ratio))
            n_val = max(0, int(n_total * val_ratio))
            
            train_ids.extend(img_list[:n_train])
            val_ids.extend(img_list[n_train:n_train + n_val])
            test_ids.extend(img_list[n_train + n_val:])
        
        return {
            'train': train_ids,
            'val': val_ids,
            'test': test_ids
        }


class LabelAnalyzer:
    """
    Advanced label analytics and imbalance detection
    """
    
    @staticmethod
    def analyze_class_distribution(annotations: List[Dict]) -> Dict[str, Any]:
        """
        Analyze class distribution and detect imbalances
        
        Args:
            annotations: List of annotation dictionaries
            
        Returns:
            Comprehensive analytics dictionary
        """
        from collections import Counter
        import math
        
        if not annotations:
            return {
                'total_annotations': 0,
                'num_classes': 0,
                'class_distribution': {},
                'is_balanced': True,
                'imbalance_ratio': 0,
                'gini_coefficient': 0,
                'entropy': 0,
                'recommendations': []
            }
        
        # Count class occurrences
        class_counts = Counter(ann['class_name'] for ann in annotations)
        total_annotations = len(annotations)
        num_classes = len(class_counts)
        
        # Calculate statistics
        counts = list(class_counts.values())
        most_common_count = max(counts)
        least_common_count = min(counts)
        
        # Imbalance ratio
        imbalance_ratio = most_common_count / least_common_count if least_common_count > 0 else float('inf')
        
        # Gini coefficient (measure of inequality)
        def gini_coefficient(values):
            sorted_values = sorted(values)
            n = len(sorted_values)
            cumsum = np.cumsum(sorted_values)
            return (n + 1 - 2 * sum((n + 1 - i) * y for i, y in enumerate(sorted_values))) / (n * sum(sorted_values))
        
        gini = gini_coefficient(counts)
        
        # Entropy (information content)
        probabilities = [count / total_annotations for count in counts]
        entropy = -sum(p * math.log2(p) for p in probabilities if p > 0)
        max_entropy = math.log2(num_classes) if num_classes > 1 else 0
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
        
        # Determine if balanced
        is_balanced = imbalance_ratio <= 3.0 and gini <= 0.3
        
        # Generate recommendations
        recommendations = []
        if imbalance_ratio > 5.0:
            recommendations.append("High class imbalance detected. Consider data augmentation for minority classes.")
        if gini > 0.4:
            recommendations.append("Uneven class distribution. Consider collecting more data for underrepresented classes.")
        if normalized_entropy < 0.7:
            recommendations.append("Low diversity in class distribution. Consider balancing the dataset.")
        
        # Suggest augmentation techniques based on imbalance
        if imbalance_ratio > 3.0:
            recommendations.extend([
                "Use geometric augmentations (rotation, flip, crop) for minority classes",
                "Apply color augmentations (brightness, contrast, saturation) to increase diversity",
                "Consider synthetic data generation techniques"
            ])
        
        return {
            'total_annotations': total_annotations,
            'num_classes': num_classes,
            'class_distribution': dict(class_counts),
            'most_common_class': max(class_counts, key=class_counts.get),
            'most_common_count': most_common_count,
            'least_common_class': min(class_counts, key=class_counts.get),
            'least_common_count': least_common_count,
            'imbalance_ratio': imbalance_ratio,
            'gini_coefficient': gini,
            'entropy': entropy,
            'normalized_entropy': normalized_entropy,
            'is_balanced': is_balanced,
            'needs_augmentation': imbalance_ratio > 3.0,
            'recommendations': recommendations
        }
    
    @staticmethod
    def analyze_split_distribution(annotations: List[Dict], split_assignments: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        Analyze class distribution across train/val/test splits
        
        Args:
            annotations: List of annotation dictionaries
            split_assignments: Dictionary mapping split names to image IDs
            
        Returns:
            Split-wise distribution analysis
        """
        from collections import defaultdict, Counter
        
        # Group annotations by split
        split_annotations = defaultdict(list)
        image_to_split = {}
        
        for split_name, image_ids in split_assignments.items():
            for img_id in image_ids:
                image_to_split[img_id] = split_name
        
        for ann in annotations:
            split_name = image_to_split.get(ann['image_id'], 'unassigned')
            split_annotations[split_name].append(ann)
        
        # Analyze each split
        split_analysis = {}
        for split_name, split_anns in split_annotations.items():
            split_analysis[split_name] = LabelAnalyzer.analyze_class_distribution(split_anns)
        
        # Check consistency across splits
        all_classes = set()
        for split_anns in split_annotations.values():
            all_classes.update(ann['class_name'] for ann in split_anns)
        
        missing_classes = {}
        for split_name, split_anns in split_annotations.items():
            split_classes = set(ann['class_name'] for ann in split_anns)
            missing_classes[split_name] = list(all_classes - split_classes)
        
        return {
            'split_analysis': split_analysis,
            'all_classes': list(all_classes),
            'missing_classes_per_split': missing_classes,
            'consistent_splits': all(not missing for missing in missing_classes.values())
        }